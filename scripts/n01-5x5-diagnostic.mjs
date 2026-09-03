import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const checks = [];
async function source(file) { return readFile(path.join(root, file), 'utf8'); }
function check(domain, name, condition) { assert.ok(condition, `${domain}/${name}`); checks.push({ domain, name, ok: true }); }

const packageJson = JSON.parse(await source('package.json'));
const manifest = JSON.parse(await source('SOUL-FUSION-MANIFEST.json'));
const registry = JSON.parse(await source('docs/SOUL-FUSION-REGISTRY.json'));
const contract = await source('scripts/soul-mesh-contract-check.mjs');
const server = await source('scripts/soul-mesh-server.mjs');
const adapter = await source('src/core/soul/CanonicalTransportAdapter.ts');
const transportTest = await source('scripts/test-canonical-transport.mjs');
const health = await source('lib/soul-mesh/SoulMeshHealth.ts');
const diagnostics = await source('scripts/diagnostics.mjs');
const sentinel = await source('soul-sentinel/app/src/main/java/com/divibisoul/soul/SoulAdminService.kt');
const cortex = await source('soul-sentinel/app/src/main/java/com/divibisoul/soul/SoulCortex.kt');
const boot = await source('soul-sentinel/app/src/main/java/com/divibisoul/soul/SoulBootReceiver.kt');
const config = await source('soul-sentinel/app/src/main/java/com/divibisoul/soul/SoulConfig.kt');

const domains = [
  ['CORE', [
    ['package-type-module', packageJson.type === 'module'],
    ['typecheck-script', packageJson.scripts?.typecheck === 'tsc --noEmit'],
    ['fusion-manifest', manifest.system === 'SOUL' && manifest.nucleus === 'N01'],
    ['seven-nuclei', JSON.stringify(manifest.peers) === JSON.stringify(['N02','N03','N04','N05','N06','N07'])],
    ['native-ownership', manifest.capabilityOwnership === 'native'],
  ]],
  ['TRANSPORT', [
    ['canonical-adapter-present', adapter.includes('export function acceptCanonicalEnvelope') && adapter.includes('resolveCanonicalTransport')],
    ['transport-regression-present', transportTest.includes('CanonicalTransportAdapter')],
    ['five-transports', manifest.transports?.length === 5],
    ['mesh-protocol-version', contract.includes("EXPECTED = '1.1.0'")],
    ['directional-links-42', contract.includes('directionalChannels:42')],
  ]],
  ['MESH', [
    ['peer-set-six', server.includes("const PEER_IDS = ['N02', 'N03', 'N04', 'N05', 'N06', 'N07'];")],
    ['registration-validation', server.includes('PEER_IDS.includes(body.nucleus)')],
    ['heartbeat-validation', server.includes('PEER_IDS.includes(id)')],
    ['delegation-validation', server.includes('PEER_IDS.includes(target)')],
    ['health-engine', health.includes('health')],
  ]],
  ['INTEGRITY', [
    ['fusion-registry-v15', registry.version === '1.5'],
    ['fusion-seven-nuclei', Object.keys(registry.nuclei).length === 7],
    ['fusion-42-links', registry.peerContract.directionalChannels === 42],
    ['fusion-bidirectional', registry.peerContract.communication === 'bidirectional'],
    ['diagnostics-engine', diagnostics.includes('.diagnostics')],
  ]],
  ['SENTINEL', [
    ['admin-service', sentinel.includes('class SoulAdminService')],
    ['integrity-snapshot', cortex.includes('fun integritySnapshot') && cortex.includes('coreHealthy') && cortex.includes('meshHealthy')],
    ['metrics', sentinel.includes('metrics') || sentinel.includes('integrity core=')],
    ['watchdog', sentinel.includes('watchdog') && sentinel.includes('scheduleSelfRestart')],
    ['boot-enabled', boot.includes('SoulConfig') && boot.includes('startForegroundService') && config.includes('prefs.getBoolean("enabled", true)')],
  ]],
];

for (const [domain, items] of domains) for (const [name, condition] of items) check(domain, name, condition);
console.log(JSON.stringify({ ok: true, diagnostic: 'N01-5x5-structural', checks: checks.length, matrix: Object.fromEntries(domains.map(([domain, items]) => [domain, items.length])), liveMesh: false, note: 'Structural certification only; deployed peer availability remains a runtime gate.' }, null, 2));
