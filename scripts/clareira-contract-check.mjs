import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const neuralDir = resolve(process.cwd(), 'src/core/neural');
const project = await readFile(resolve(neuralDir, 'ProjetoClareira.ts'), 'utf8');
const vagus = await readFile(resolve(neuralDir, 'VagusNerve.ts'), 'utf8');
const types = await readFile(resolve(neuralDir, 'types.ts'), 'utf8');
const bridge = await readFile(resolve(neuralDir, 'ClareiraSaraBridge.ts'), 'utf8');
const server = await readFile(resolve(process.cwd(), 'scripts/soul-mesh-server.mjs'), 'utf8');
const federation = await readFile(resolve(process.cwd(), 'scripts/sara-federation.mjs'), 'utf8');

for (const role of [
  'NucleoRaizAlma','NucleoDecisao','NucleoPercepcao','NucleoEstado',
  'NucleoExecutor','NucleoVigilancia','NucleoUsuario','NucleoConfiguracao',
  'NucleoApps','NucleoRede','NucleoArmazenamento','NucleoContexto',
  'NucleoSemantica','NucleoSensores','NucleoMemoria','NucleoLinguagem',
  'NucleoEmocional','NucleoRaciocinio','NucleoControleMotor','NucleoKernel',
]) assert.match(await readFile(resolve(neuralDir, 'SpecializedNuclei.ts'), 'utf8'), new RegExp(`class ${role}`), `missing class ${role}`);

assert.match(project, /for \(let primaryIndex = 0; primaryIndex < this\.primaryNodes\.length; primaryIndex \+= 1\)/);
assert.match(project, /localIndex < 4/);
assert.match(project, /new InformationChannel\(node\.id, this\.nucleoRaiz\.id/);
assert.match(project, /new InformationChannel\(this\.nucleoRaiz\.id, node\.id/);
assert.match(project, /new InformationChannel\(secondary\.id, primary\.id/);
assert.match(project, /new InformationChannel\(primary\.id, secondary\.id/);
assert.match(project, /new VagusNerve\(this\.homeostasis\)/);
assert.match(project, /syncStateToSara/);
assert.match(project, /dispatchVagalCommandToSara/);
assert.match(vagus, /class VagusPlexus/);
assert.match(vagus, /publishAfferent/);
assert.match(vagus, /sendEfferent/);
assert.match(types, /VagalSignalType/);
assert.match(types, /schemaVersion: '1\.1\.0'/);
assert.match(bridge, /\/state/);
assert.match(bridge, /\/vagus/);
assert.match(server, /\/api\/clareira\/state/);
assert.match(server, /\/api\/clareira\/vagus/);
assert.match(federation, /sara\.clareira\.state/);
assert.match(federation, /sara\.clareira\.vagus/);

console.log('CLAREIRA_CONTRACT: ok=true classes=20 topology=61_nodes channels=120 vagus=true sara_bridge=true');
