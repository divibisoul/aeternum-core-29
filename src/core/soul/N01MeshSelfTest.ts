import { createEnvelope, verifyEnvelope } from './SoulMeshEnvelope';
import { validateN01Task } from './N01DispatchContract';

export async function runN01MeshSelfTest(secret: string) {
  const ping = await createEnvelope({ version: '1.0', source: 'N01', target: 'N02', type: 'PING', payload: { probe: 'N01' } }, secret);
  const pingValid = await verifyEnvelope(ping, secret);
  const task = await createEnvelope({ version: '1.0', source: 'N02', target: 'N01', type: 'TASK', payload: { capabilityId: 'audio.capture' } }, secret);
  const taskValidation = await validateN01Task(task, secret);
  const tampered = { ...ping, payload: { probe: 'tampered' } };
  const tamperedRejected = !(await verifyEnvelope(tampered, secret));
  return { pingValid, taskValidation, tamperedRejected };
}
