import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { SOUL_MESH_PROTOCOL, SOUL_MESH_CONTRACT_VERSION, SOUL_NUCLEI } from '../src/core/mesh/SoulMeshProtocol.ts';

const serverPath = resolve(process.cwd(), 'scripts/soul-mesh-server.mjs');
const entryPath = resolve(process.cwd(), 'scripts/soul-mesh-server-entry.mjs');
const server = await readFile(serverPath, 'utf8');
const entry = await readFile(entryPath, 'utf8');

assert.equal(SOUL_MESH_PROTOCOL, 'soul-mesh/1');
assert.equal(SOUL_MESH_CONTRACT_VERSION, '1.1.0');
assert.deepEqual(SOUL_NUCLEI, ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07']);

assert.match(server, /const PROTOCOL = 'soul-mesh\/1';/);
assert.match(server, /const CONTRACT_VERSION = '1\.1\.0';/);
assert.match(entry, /const PROTOCOL = 'soul-mesh\/1';/);
assert.match(entry, /const CONTRACT_VERSION = '1\.1\.0';/);

const peerSource = server.match(/const PEER_IDS = \[(.*?)\];/s)?.[1] ?? '';
for (const nucleus of SOUL_NUCLEI.slice(1)) {
  assert.match(peerSource, new RegExp(`'${nucleus}'`), `active gateway missing peer ${nucleus}`);
}

console.log('SOUL_MESH_DUAL_RUNTIME_CONTRACT: ok=true');
console.log(`canonical=${SOUL_MESH_PROTOCOL} contract=${SOUL_MESH_CONTRACT_VERSION}`);
console.log('typescript_runtime=validated');
console.log('node_gateway=validated');
console.log('legacy_entry=validated');
console.log('n07=structural_peer_only_until_real_commissioning');
