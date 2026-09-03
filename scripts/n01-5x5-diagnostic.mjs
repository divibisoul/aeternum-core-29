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
    ['canonical-adapter-present', adapter.includes('export class CanonicalTransportAdapter') || adapter.includes('export const CanonicalTransportAdapter')],
    ['transport-regression-present', transportTest.includes('CanonicalTransportAdapter')],
    ['five-transports', manifest.transports?.length === 5],
    ['mesh-protocol-version', contract.includes("const EXPECTED = '1.1.0'" )],
    ['directional-links-42', contract.includes('directionalChannels:42')],
  ]],
  ['MESH', [
    ['peer-set-six', server.includes("const PEER_IDS = ['N02', 'N03', 'N04', 'N05', 'N06', 'N07'];")],
    ['registration-validation', server.includes('PEER_IDS.includes(body.nucleus)')],
    ['heartbeat-validation', server.includes('PEER_IDS.includes(id)')],
    ['delegation-validation', server.includes('PEER_IDS.includes(target)')],
    ['health-engine', health.includes('export') && health.includes('health')],
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
    ['integrity-check', sentinel.includes('checkCoreIntegrity') || sentinel.includes('checkMeshIntegrity')],
    ['metrics', sentinel.includes('metrics') || sentinel.includes('Metric')],
    ['watchdog', sentinel.includes('watchdog') || sentinel.includes('restart')],
    ['boot-enabled', boot.includes('SoulConfig') && boot.includes('start')],
  ]],
];

for (const [domain, items] of domains) for (const [name, condition] of items) check(domain, name, condition);

const failed = checks.filter((item) => !item.ok);
if (failed.length) throw new Error(`N01_5X5_FAILED:${failed.map((item) => `${item.domain}/${item.name}`).join(',')}`);

const byDomain = Object.fromEntries(domains.map(([domain, items]) => [domain, items.length]));
console.log(JSON.stringify({ ok: true, diagnostic: 'N01-5x5-structural', checks: checks.length, matrix: byDomain, liveMesh: false, note: 'Structural certification only; peer runtime availability requires deployed endpoints and the global Mesh gate.' }, null, 2));
