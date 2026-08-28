import type { SoulMeshEnvelope } from './SoulMeshEnvelope';

export const N01_NODE_ID = 'N01' as const;
export const N01_SUPPORTED_MESSAGES: readonly SoulMeshEnvelope['type'][] = ['PING', 'HEALTH', 'CAPABILITY_REQUEST', 'TASK', 'TASK_RESULT', 'ERROR'];
export const N01_PROTOCOL_VERSION = '1.0' as const;

export function isN01Target(target: SoulMeshEnvelope['target']): boolean {
  return target === N01_NODE_ID || target === 'BROADCAST';
}
