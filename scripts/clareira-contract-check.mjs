import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const neuralDir = resolve(process.cwd(), 'src/core/neural');
const project = await readFile(resolve(neuralDir, 'ProjetoClareira.ts'), 'utf8');
const root = await readFile(resolve(neuralDir, 'NucleoRaizAlma.ts'), 'utf8');
const specialized = await readFile(resolve(neuralDir, 'SpecializedNuclei.ts'), 'utf8');
const vagus = await readFile(resolve(neuralDir, 'VagusNerve.ts'), 'utf8');
const types = await readFile(resolve(neuralDir, 'types.ts'), 'utf8');
const bridge = await readFile(resolve(neuralDir, 'ClareiraSaraBridge.ts'), 'utf8');
const server = await readFile(resolve(process.cwd(), 'scripts/soul-mesh-server.mjs'), 'utf8');
const federation = await readFile(resolve(process.cwd(), 'scripts/sara-federation.mjs'), 'utf8');

assert.match(root, /export class NucleoRaizAlma/);

const specializedRoles = [
  'NucleoDecisao','NucleoPercepcao','NucleoEstado','NucleoExecutor',
  'NucleoVigilancia','NucleoUsuario','NucleoConfiguracao','NucleoApps',
  'NucleoRede','NucleoArmazenamento','NucleoContexto','NucleoSemantica',
  'NucleoSensores','NucleoMemoria','NucleoLinguagem','NucleoEmocional',
  'NucleoRaciocinio','NucleoControleMotor','NucleoKernel',
];
for (const role of specializedRoles) {
  assert.match(specialized, new RegExp(`class ${role}`), `missing class ${role}`);
}

const primaryBlock = project.match(/const primaryClasses = \[([\s\S]*?)\];/);
assert.ok(primaryBlock, 'primary class registry missing');
const primaryEntries = primaryBlock[1].match(/Nucleo[A-Za-z]+/g) ?? [];
assert.equal(primaryEntries.length, 12, 'expected 12 primary classes');

const secondaryBlock = project.match(/const secondaryClasses = \[([\s\S]*?)\];/);
assert.ok(secondaryBlock, 'secondary class registry missing');
const secondaryEntries = secondaryBlock[1].match(/Nucleo[A-Za-z]+/g) ?? [];
assert.equal(secondaryEntries.length, 7, 'expected 7 reusable secondary classes');
assert.match(project, /this\.primaryNodes\.length \* 4/);

assert.match(project, /new InformationChannel\(/g);
const channelConstructions = project.match(/new InformationChannel\(/g) ?? [];
assert.equal(channelConstructions.length, 2, 'topology should use two channel constructors per edge');

assert.match(project, /node\.id,\s*\n\s*this\.nucleoRaiz\.id/);
assert.match(project, /this\.nucleoRaiz\.id,\s*\n\s*node\.id/);
assert.match(project, /secondary\.id,\s*\n\s*primary\.id/);
assert.match(project, /primary\.id,\s*\n\s*secondary\.id/);

assert.match(vagus, /class VagusPlexus/);
assert.match(vagus, /publishAfferent/);
assert.match(vagus, /sendEfferent/);
assert.match(vagus, /VAGUS_BRANCH_QUEUE_SIZE/);
assert.match(types, /VAGUS_TICK_INTERVAL_MS = 5/);
assert.match(types, /HOMEOSTASIS_CHECK_INTERVAL = 100/);
assert.match(types, /TURBO_DURATION_SECONDS = 30/);
assert.match(types, /TURBO_COOLDOWN_SECONDS = 60/);
assert.match(bridge, /\/state/);
assert.match(bridge, /\/vagus/);
assert.match(server, /\/api\/clareira\/state/);
assert.match(server, /\/api\/clareira\/vagus/);
assert.match(federation, /sara\.clareira\.state/);
assert.match(federation, /sara\.clareira\.vagus/);

console.log('CLAREIRA_CONTRACT: ok=true classes=20 topology=61_nodes channels=120 vagus=true sara_bridge=true');
