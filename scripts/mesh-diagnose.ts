/* Manual N01 diagnostic. Run with the project runtime configured and peers available. */

type Status = 'PASS' | 'FAIL' | 'TIMEOUT' | 'NOT_REGISTERED';
type Peer = 'N02' | 'N03' | 'N04' | 'N05' | 'N06';

const PEERS: Peer[] = ['N02', 'N03', 'N04', 'N05', 'N06'];
const TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    promise.then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
  });
}

async function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    protocol: 'soul-mesh/1',
    timeoutMs: TIMEOUT_MS,
    peers: {} as Record<string, unknown>,
  };

  for (const peer of PEERS) {
    const peerReport: Record<string, Status> = {
      inbound: 'NOT_REGISTERED',
      outbound: 'NOT_REGISTERED',
      echo: 'NOT_REGISTERED',
      eventAck: 'NOT_REGISTERED',
    };

    // This script intentionally delegates transport/discovery to the host runtime.
    // Replace the following dynamic bridge with the APK/browser runtime adapter.
    const runtime = (globalThis as typeof globalThis & { soulMeshDiagnostic?: any }).soulMeshDiagnostic;
    if (!runtime?.isRegistered || !runtime?.echo || !runtime?.eventWithConfirmation || !runtime?.probeInbound) {
      report.peers[peer] = { ...peerReport, detail: 'Diagnostic runtime adapter not configured' };
      continue;
    }

    if (!(await runtime.isRegistered(peer))) {
      report.peers[peer] = peerReport;
      continue;
    }

    try { await withTimeout(runtime.probeInbound(peer), TIMEOUT_MS); peerReport.inbound = 'PASS'; }
    catch (e) { peerReport.inbound = String(e).includes('TIMEOUT') ? 'TIMEOUT' : 'FAIL'; }

    try { await withTimeout(runtime.echo(peer), TIMEOUT_MS); peerReport.outbound = 'PASS'; peerReport.echo = 'PASS'; }
    catch (e) { peerReport.outbound = String(e).includes('TIMEOUT') ? 'TIMEOUT' : 'FAIL'; peerReport.echo = peerReport.outbound; }

    try { await withTimeout(runtime.eventWithConfirmation(peer, { ping: true }), TIMEOUT_MS); peerReport.eventAck = 'PASS'; }
    catch (e) { peerReport.eventAck = String(e).includes('TIMEOUT') ? 'TIMEOUT' : 'FAIL'; }

    report.peers[peer] = peerReport;
  }

  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
