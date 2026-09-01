import { describe, expect, it } from 'vitest';
import { buildCapabilityLinks, canCompose } from './SoulMeshCapabilityGraph';

describe('SoulMeshCapabilityGraph', () => {
  it('creates links only for executable capabilities with a compatible bidirectional transport', () => {
    const links = buildCapabilityLinks(['HTTP', 'REALTIME'], [
      { nucleus: 'N02', capability: 'ai.generate', availability: 'executable', transports: ['HTTP'] },
      { nucleus: 'N03', capability: 'audio.transcribe', availability: 'declared', transports: ['HTTP'] },
      { nucleus: 'N04', capability: 'document.create', availability: 'executable', transports: ['REALTIME'] },
    ]);

    expect(links).toEqual([
      { source: 'N01', target: 'N02', capability: 'ai.generate', transport: 'HTTP', executable: true },
      { source: 'N01', target: 'N04', capability: 'document.create', transport: 'REALTIME', executable: true },
    ]);
  });

  it('does not manufacture a composition from declared-only capabilities', () => {
    const links = buildCapabilityLinks(['HTTP'], [
      { nucleus: 'N03', capability: 'audio.transcribe', availability: 'declared', transports: ['HTTP'] },
      { nucleus: 'N02', capability: 'ai.generate', availability: 'executable', transports: ['HTTP'] },
    ]);
    expect(canCompose(links, 'audio.transcribe', 'ai.generate')).toBe(false);
  });
});
