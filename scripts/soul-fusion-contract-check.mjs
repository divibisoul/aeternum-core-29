import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'SOUL-FUSION-MANIFEST.json');
const registryPath = path.join(root, 'docs', 'SOUL-FUSION-REGISTRY.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const expected = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];
if (manifest.system !== 'SOUL' || manifest.fusionVersion !== '1.0' || manifest.nucleus !== 'N01') throw new Error('INVALID_N01_FUSION_MANIFEST');
if (manifest.independentRuntime !== true || manifest.capabilityOwnership !== 'native' || manifest.fusionGateway !== true) throw new Error('INVALID_N01_FUSION_ROLE');
if (JSON.stringify(Object.keys(registry.nuclei)) !== JSON.stringify(expected)) throw new Error('FUSION_REGISTRY_MUST_CONTAIN_SIX_NUCLEI');
if (registry.peerContract.directionalChannels !== 60 || registry.peerContract.inChannelsPerNucleus !== 5 || registry.peerContract.outChannelsPerNucleus !== 5) throw new Error('INVALID_FUSION_CHANNEL_CONTRACT');
for (const transport of ['IN_PROCESS','WEBVIEW_BRIDGE','LOOPBACK_HTTP','HTTP','REALTIME']) if (!registry.transports.includes(transport)) throw new Error(`MISSING_FUSION_TRANSPORT:${transport}`);
if (registry.ownership !== 'native-per-nucleus' || registry.fusionMode !== 'federated-independent-runtimes') throw new Error('INVALID_FUSION_OWNERSHIP_MODEL');
console.log('SOUL fusion contract: VALID');
