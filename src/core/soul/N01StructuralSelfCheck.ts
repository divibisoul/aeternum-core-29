import { getN01Capabilities, validateCapabilityGraph } from './CapabilityGraph';
import { createEnvelope, verifyEnvelope } from './SoulMeshEnvelope';

export async function runN01StructuralSelfCheck(secret: string): Promise<{ capabilities: number; envelope: boolean; authorizationReady: boolean }> {
  const capabilities = getN01Capabilities();
  validateCapabilityGraph(capabilities);
  const envelope = await createEnvelope({ version: '1.0', source: 'N01', target: 'N02', type: 'PING', payload: { probe: true } }, secret);
  const verified = await verifyEnvelope(envelope, secret);
  return { capabilities: capabilities.length, envelope: verified, authorizationReady: true };
}
