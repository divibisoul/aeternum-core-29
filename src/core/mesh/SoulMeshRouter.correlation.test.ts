import test from 'node:test';
import assert from 'node:assert/strict';
import { SoulMeshRouter } from './SoulMeshRouter';
import type { SoulMeshMessage, SoulMeshTransport } from './SoulMeshProtocol';

test('SoulMeshRouter preserves an explicit caller correlationId', async () => {
  let receive: ((message: SoulMeshMessage) => void | Promise<void>) | undefined;
  let outbound: SoulMeshMessage | undefined;

  const transport: SoulMeshTransport = {
    onMessage(handler) {
      receive = handler;
      return () => { receive = undefined; };
    },
    async send(message) {
      outbound = message;
      queueMicrotask(() => {
        void receive?.({
          protocol: message.protocol,
          contractVersion: message.contractVersion,
          id: 'response-1',
          correlationId: message.correlationId,
          source: 'N02',
          target: 'N01',
          kind: 'response',
          capability: message.capability,
          payload: { ok: true },
          timestamp: Date.now(),
        });
      });
    },
  };

  const router = new SoulMeshRouter(transport, 'N01', 1000);
  const result = await router.request('N02', 'strategic_planning', { input: 'x' }, 'corr-n01-explicit');

  assert.equal(outbound?.correlationId, 'corr-n01-explicit');
  assert.equal(result.correlationId, 'corr-n01-explicit');
  router.close();
});
