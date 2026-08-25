import { R1_PEER_ROUTES } from './SoulMeshPeerMatrix';

describe('R1 Soul Mesh peer matrix', () => {
  it('has exactly five IN and five OUT routes', () => {
    expect(R1_PEER_ROUTES).toHaveLength(10);
    expect(R1_PEER_ROUTES.filter((r) => r.direction === 'in')).toHaveLength(5);
    expect(R1_PEER_ROUTES.filter((r) => r.direction === 'out')).toHaveLength(5);
    expect(R1_PEER_ROUTES.every((r) => r.enabled)).toBe(true);
  });
});
