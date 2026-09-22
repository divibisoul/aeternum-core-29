/**
 * PROJETO CLAREIRA — 19 núcleos especializados complementares.
 *
 * O blueprint fornecido contém 20 classes ao todo: NucleoRaizAlma +
 * 19 especializações. A contagem "19 núcleos" do material original é,
 * portanto, uma inconsistência documental, corrigida aqui sem remover nenhuma função.
 */
import { ProcessingNode } from './ProcessingNode';
import type { InformationPacket, NodeLevel, PacketType } from './types';

abstract class SpecializedNucleus extends ProcessingNode {
  protected constructor(id: string, level: NodeLevel, protected readonly role: string) {
    super(id, level);
  }

  protected rolePacket(
    packet: InformationPacket,
    data: string,
    packetType: PacketType,
    criticality = 0.5,
    destinationHint?: string,
  ) {
    return {
      data,
      packetType,
      destinationHint,
      criticality: Math.max(packet.criticality, Math.min(1, criticality)),
      metadata: { role: this.role, originPacketId: packet.id },
    };
  }
}

export class NucleoDecisao extends SpecializedNucleus {
  constructor(id = 'NP-Decisao') { super(id, 'Primary', 'decision'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data' || packet.packetType === 'Command') {
      return this.rolePacket(packet, `decision::accepted::${packet.sourceId}`, 'DecisionResponse', 0.65);
    }
    return null;
  }
}

export class NucleoPercepcao extends SpecializedNucleus {
  constructor(id = 'NP-Percepcao') { super(id, 'Primary', 'perception'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data') {
      return this.rolePacket(packet, `perception::features::${packet.data.length}`, 'Result', 0.55);
    }
    return null;
  }
}

export class NucleoEstado extends SpecializedNucleus {
  constructor(id = 'NP-Estado') { super(id, 'Primary', 'state'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data' || packet.packetType === 'StateReport') {
      return this.rolePacket(packet, 'state::aggregated', 'StateReport', 0.60);
    }
    return null;
  }
}

export class NucleoExecutor extends SpecializedNucleus {
  constructor(id = 'NP-Executor') { super(id, 'Primary', 'executor'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Command') {
      return this.rolePacket(packet, 'executor::accepted', 'Signal', 0.70, packet.sourceId);
    }
    return null;
  }
}

export class NucleoVigilancia extends SpecializedNucleus {
  constructor(id = 'NP-Vigilancia') { super(id, 'Primary', 'surveillance'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.criticality >= 0.85) {
      return this.rolePacket(packet, 'vigilance::alert', 'Signal', 0.95);
    }
    return null;
  }
}

export class NucleoUsuario extends SpecializedNucleus {
  constructor(id = 'NP-Usuario') { super(id, 'Primary', 'user'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data') {
      return this.rolePacket(packet, 'user::state_updated', 'StateReport', 0.55);
    }
    return null;
  }
}

export class NucleoConfiguracao extends SpecializedNucleus {
  constructor(id = 'NP-Configuracao') { super(id, 'Primary', 'configuration'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Command' || packet.packetType === 'Control') {
      return this.rolePacket(packet, 'configuration::applied', 'Control', 0.70);
    }
    return null;
  }
}

export class NucleoApps extends SpecializedNucleus {
  constructor(id = 'NP-Apps') { super(id, 'Primary', 'apps'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data') {
      return this.rolePacket(packet, 'apps::managed', 'Result', 0.50);
    }
    return null;
  }
}

export class NucleoRede extends SpecializedNucleus {
  constructor(id = 'NP-Rede') { super(id, 'Primary', 'network'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data' || packet.packetType === 'Control') {
      return this.rolePacket(packet, 'network::policy_ok', 'Result', 0.60);
    }
    return null;
  }
}

export class NucleoArmazenamento extends SpecializedNucleus {
  constructor(id = 'NP-Armazenamento') { super(id, 'Primary', 'storage'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data') {
      return this.rolePacket(packet, 'storage::accepted', 'StateReport', 0.55);
    }
    return null;
  }
}

export class NucleoContexto extends SpecializedNucleus {
  constructor(id = 'NP-Contexto') { super(id, 'Primary', 'context'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data' || packet.packetType === 'DecisionRequest') {
      return this.rolePacket(packet, 'context::enriched', 'Result', 0.60);
    }
    return null;
  }
}

export class NucleoSemantica extends SpecializedNucleus {
  constructor(id = 'MS-Semantica') { super(id, 'Secondary', 'semantics'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data') {
      return this.rolePacket(packet, `semantic::tokens=${packet.data.trim().split(/\s+/).filter(Boolean).length}`, 'Result', 0.55);
    }
    return null;
  }
}

export class NucleoSensores extends SpecializedNucleus {
  constructor(id = 'MS-Sensores') { super(id, 'Secondary', 'sensors'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data') {
      return this.rolePacket(packet, `sensor::bytes=${packet.data.length}`, 'Result', 0.65);
    }
    return null;
  }
}

export class NucleoMemoria extends SpecializedNucleus {
  constructor(id = 'MS-Memoria') { super(id, 'Secondary', 'memory'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data') {
      return this.rolePacket(packet, 'memory::stored', 'Result', 0.60);
    }
    return null;
  }
}

export class NucleoLinguagem extends SpecializedNucleus {
  constructor(id = 'MS-Linguagem') { super(id, 'Secondary', 'language'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data') {
      return this.rolePacket(packet, 'language::parsed', 'Result', 0.60);
    }
    return null;
  }
}

export class NucleoEmocional extends SpecializedNucleus {
  constructor(id = 'MS-Emocional') { super(id, 'Secondary', 'affective'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data') {
      return this.rolePacket(packet, 'affect::valence=0', 'Result', 0.45);
    }
    return null;
  }
}

export class NucleoRaciocinio extends SpecializedNucleus {
  constructor(id = 'MS-Raciocinio') { super(id, 'Secondary', 'reasoning'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Data' || packet.packetType === 'DecisionRequest') {
      return this.rolePacket(packet, 'reason::inference', 'DecisionResponse', 0.75);
    }
    return null;
  }
}

export class NucleoControleMotor extends SpecializedNucleus {
  constructor(id = 'MS-ControleMotor') { super(id, 'Secondary', 'motor_control'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Command' || packet.packetType === 'Control') {
      return this.rolePacket(packet, 'motor::accepted', 'Signal', 0.80, packet.sourceId);
    }
    return null;
  }
}

export class NucleoKernel extends SpecializedNucleus {
  constructor(id = 'NP-Kernel') { super(id, 'Primary', 'kernel'); }
  protected nodeSpecificProcessing(packet: InformationPacket) {
    if (packet.packetType === 'Control') {
      return this.rolePacket(packet, 'kernel::applied', 'Signal', 0.85, 'NC-001');
    }
    return null;
  }
}
