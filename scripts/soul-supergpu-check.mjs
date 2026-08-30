import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'SOUL-FUSION-REGISTRY.json'), 'utf8'));
const requiredNuclei = ['N01','N02','N03','N04','N05','N06'];
const requiredBackends = ['IN_PROCESS','WEBASSEMBLY','WEBGPU','REMOTE_MESH'];
const requiredStages = ['capability-resolution','unified-execution','supergpu-scheduling','parallel-execution','compute-backend-selection'];
if (registry.version !== '1.4') throw new Error(`INVALID_FUSION_REGISTRY_VERSION:${registry.version}`);
if (JSON.stringify(Object.keys(registry.nuclei)) !== JSON.stringify(requiredNuclei)) throw new Error('SUPERGPU_REQUIRES_SIX_NUCLEI');
if (registry.superGPU?.mode !== 'federated-software-fabric') throw new Error('SUPERGPU_MODE_INVALID');
if (registry.superGPU?.hardwareGpu !== false) throw new Error('SUPERGPU_HARDWARE_CLAIM_INVALID');
for (const backend of requiredBackends) if (!registry.superGPU.backends.includes(backend)) throw new Error(`SUPERGPU_BACKEND_MISSING:${backend}`);
for (const stage of requiredStages) if (!registry.fusionStages.includes(stage)) throw new Error(`SUPERGPU_STAGE_MISSING:${stage}`);
if (registry.superGPU.parallel !== true || registry.superGPU.nativeCapabilityPreservation !== true) throw new Error('SUPERGPU_INVARIANT_MISSING');
console.log(JSON.stringify({ ok:true, system:'SOUL', fusionVersion:registry.version, mode:registry.superGPU.mode, hardwareGpu:false, nuclei:requiredNuclei.length, backends:registry.superGPU.backends, stages:requiredStages }, null, 2));
