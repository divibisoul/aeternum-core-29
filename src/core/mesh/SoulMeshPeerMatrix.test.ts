import { R1_PEER_ROUTES, SOUL_MESH_DIRECTIONAL_CHANNEL_COUNT, SOUL_MESH_CHANNEL_ENDPOINT_COUNT } from './SoulMeshPeerMatrix';

describe('R1 Soul Mesh peer matrix', () => {
  it('has exactly six IN and six OUT routes for N01', () => {
    expect(R1_PEER_ROUTES).toHaveLength(12);
    expect(R1_PEER_ROUTES.filter((r) => r.direction === 'in')).toHaveLength(6);
    expect(R1_PEER_ROUTES.filter((r) => r.direction === 'out')).toHaveLength(6);
    expect(R1_PEER_ROUTES.every((r) => r.enabled)).toBe(true);
  });

  it('distinguishes peer links from IN/OUT channel endpoints', () => {
    expect(SOUL_MESH_DIRECTIONAL_CHANNEL_COUNT).toBe(42);
    expect(SOUL_MESH_CHANNEL_ENDPOINT_COUNT).toBe(84);
  });
});
