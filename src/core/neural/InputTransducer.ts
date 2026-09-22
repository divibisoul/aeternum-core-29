/**
 * CLAREIRA — InputTransducer
 *
 * Converte entrada externa em InformationPacket sem criar valor arbitrário:
 * valor informacional depende do tamanho/diversidade e é modulado por
 * temperatura/carga observadas no runtime.
 */
import type { InformationPacket } from './types';
import { createInformationPacket, THERMAL_STRESS_WARN, THERMAL_STRESS_CRITICAL } from './types';

export class InputTransducer {
  readonly name = 'InputTransducer';
  readonly version = '1.1.0';

  transduce(
    rawData: string,
    sourceId = 'EXTERNAL',
    thermalRatio = 0.3,
    loadRatio = 0.5,
    packetType: InformationPacket['packetType'] = 'Data',
    destinationHint?: string,
    metadata: Record<string, unknown> = {},
  ): InformationPacket {
    const normalizedThermal = Math.max(0, Math.min(1, thermalRatio));
    const normalizedLoad = Math.max(0, Math.min(1, loadRatio));
    const diversity = this.byteDiversity(rawData);
    const entropy = this.entropy(rawData);
    const thermalEfficiency = normalizedThermal >= THERMAL_STRESS_CRITICAL
      ? 0.2
      : Math.max(0.1, 1 - Math.max(0, normalizedThermal - THERMAL_STRESS_WARN) * 2);
    const loadEfficiency = Math.max(0.1, 1 - normalizedLoad * 0.2);
    const informationalValue = Math.max(
      0.01,
      Math.min(600, rawData.length * (1 + diversity) * 0.2 * thermalEfficiency * loadEfficiency),
    );

    let criticality = entropy;
    if (packetType === 'Command' || packetType === 'Control' || packetType === 'StateReport' || packetType === 'IPC') {
      criticality = Math.max(0.6, criticality);
    }

    return createInformationPacket(
      rawData,
      informationalValue,
      Math.max(0, Math.min(1, criticality)),
      packetType,
      sourceId,
      destinationHint,
      {
        ...metadata,
        transducer: this.name,
        transducerVersion: this.version,
        entropy,
        diversity,
        thermalRatio: normalizedThermal,
        loadRatio: normalizedLoad,
      },
    );
  }

  entropy(data: string): number {
    if (!data.length) return 0;
    const counts = new Map<number, number>();
    for (const ch of new TextEncoder().encode(data)) {
      counts.set(ch, (counts.get(ch) ?? 0) + 1);
    }
    const total = data.length;
    let entropy = 0;
    for (const count of counts.values()) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
    return Math.max(0, Math.min(1, entropy / 8));
  }

  byteDiversity(data: string): number {
    if (!data.length) return 0;
    return new Set(new TextEncoder().encode(data)).size / 256;
  }
}
