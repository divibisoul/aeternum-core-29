import type { N01PeerId } from './N01Channels';
import { N01_PEERS } from './N01Channels';

export interface N01ChannelProbeResult {
  peerId: N01PeerId;
  inbound: 'pass' | 'fail' | 'not-registered' | 'timeout';
  outbound: 'pass' | 'fail' | 'not-registered' | 'timeout';
  echo: 'pass' | 'fail' | 'not-registered' | 'timeout';
  eventAck: 'pass' | 'fail' | 'not-registered' | 'timeout';
  detail?: string;
}

export interface N01ProbeExecutor {
  echo(peerId: N01PeerId): Promise<void>;
  eventWithConfirmation(peerId: N01PeerId, timeoutMs: number): Promise<void>;
  inbound(peerId: N01PeerId): Promise<void>;
}

export async function probeN01FiveByFive(executor: N01ProbeExecutor): Promise<N01ChannelProbeResult[]> {
  const results: N01ChannelProbeResult[] = [];
  for (const peerId of N01_PEERS) {
    const result: N01ChannelProbeResult = { peerId, inbound: 'fail', outbound: 'fail', echo: 'fail', eventAck: 'fail' };
    try { await executor.inbound(peerId); result.inbound = 'pass'; } catch (error) { result.detail = String(error); }
    try { await executor.echo(peerId); result.outbound = 'pass'; result.echo = 'pass'; } catch (error) { result.detail = String(error); }
    try { await executor.eventWithConfirmation(peerId, 3000); result.eventAck = 'pass'; } catch (error) { result.detail = String(error); }
    results.push(result);
  }
  return results;
}
