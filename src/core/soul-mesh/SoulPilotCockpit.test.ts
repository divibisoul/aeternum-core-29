import { describe, expect, it } from 'vitest';
import { SoulPilotCockpit } from './SoulPilotCockpit';

describe('SoulPilotCockpit', () => {
  it('starts with exactly sixty directional channels and no false positives', () => {
    const cockpit = new SoulPilotCockpit();
    const summary = cockpit.summary();
    expect(summary.total).toBe(60);
    expect(summary.UNVERIFIED).toBe(60);
    expect(summary.CONNECTED).toBe(0);
  });

  it('keeps dispatch parallelizable and affinity-driven', () => {
    const cockpit = new SoulPilotCockpit();
    const plan = cockpit.dispatch('N01', ['perception', 'tools', 'cognition']);
    expect(plan).toHaveLength(3);
    expect(plan.every((item) => item.parallelizable)).toBe(true);
    expect(plan.every((item) => item.candidates.length === 5)).toBe(true);
  });
});
