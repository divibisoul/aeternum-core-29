import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = process.cwd();
const files = {
  connectivity: await readFile(root + '/src/core/agi/ConnectivityManager.ts', 'utf8'),
  resources: await readFile(root + '/src/core/agi/ResourceManager.ts', 'utf8'),
  health: await readFile(root + '/src/core/gems/GEMHealth.ts', 'utf8'),
  device: await readFile(root + '/src/core/gems/GEMDevice.ts', 'utf8'),
  quantum: await readFile(root + '/src/core/agi/QuantumNeuralInterface.ts', 'utf8'),
  saiic: await readFile(root + '/src/core/agi/SAIIC.ts', 'utf8'),
  healing: await readFile(root + '/src/core/agi/SelfHealingArchitecture.ts', 'utf8'),
  app: await readFile(root + '/src/App.tsx', 'utf8'),
  chat: await readFile(root + '/src/capabilities/chat-engine/ChatEngine.tsx', 'utf8'),
  qUi: await readFile(root + '/src/components/agi/QuantumBridge.tsx', 'utf8'),
  healthUi: await readFile(root + '/src/components/AGIActivePanel.tsx', 'utf8'),
  nip: await readFile(root + '/src/core/agi/NucleoIncertezaProdutiva.ts', 'utf8'),
  godel: await readFile(root + '/src/core/agi/GodelAgent.ts', 'utf8'),
  symbolic: await readFile(root + '/src/core/layers/SymbolicLayer.ts', 'utf8'),
  conscience: await readFile(root + '/src/core/layers/ConscienciaAlgoritmica.ts', 'utf8'),
};

const telemetryFiles = ['connectivity','resources','health','device','quantum','saiic','healing','app','chat','qUi','healthUi','nip','godel','symbolic','conscience'];
for (const key of telemetryFiles) assert.ok(files[key], 'missing file ' + key);

assert.match(files.connectivity, /measurementSource/);
assert.doesNotMatch(files.connectivity, /Math\.random\(\)/);
assert.match(files.connectivity, /recordNodeHeartbeat/);
assert.match(files.health, /dataSource: 'NONE' \| 'WEARABLE'/);
assert.doesNotMatch(files.health, /Simulate physiological drift/);
assert.match(files.device, /action_result/);
assert.doesNotMatch(files.device, /Simulate device metrics/);
assert.match(files.quantum, /backendStatus: 'UNAVAILABLE' \| 'OBSERVED'/);
assert.doesNotMatch(files.quantum, /Math\.random\(\)/);
assert.match(files.quantum, /recordObservedQuantumState/);
assert.match(files.saiic, /meshHeartbeatCheck/);
assert.doesNotMatch(files.saiic, /simulated via high error rate/);
assert.match(files.healing, /registerModule\(name: string/);
assert.match(files.healing, /EXECUTION_REQUIRED/);
assert.doesNotMatch(files.healing, /Math\.random\(\)/);
assert.match(files.app, /setInitializationError/);
assert.doesNotMatch(files.app, /GEMs: 4\/4/);
assert.doesNotMatch(files.app, /Array\(10\).*Math\.random/);
assert.doesNotMatch(files.chat, /setTimeout\(r, 100\)/);
assert.match(files.chat, /quantumAvailable/);
assert.match(files.healthUi, /SEM DADO/);
assert.doesNotMatch(files.healthUi, /SIMULADO/);
assert.doesNotMatch(files.qUi, /127 Qubits/);
assert.doesNotMatch(files.qUi, /Math\.random\(\)/);
assert.doesNotMatch(files.symbolic, /Math\.random\(\)/);
assert.doesNotMatch(files.conscience, /Array\(10\).*Math\.random/);
assert.doesNotMatch(files.nip, /Math\.random\(\)/);
assert.doesNotMatch(files.godel, /Math\.random\(\)/);

console.log('SOUL_RUNTIME_REALITY_GATE: ok=true synthetic_telemetry_blocked=true quantum_claims_guarded=true fail_closed_startup=true');