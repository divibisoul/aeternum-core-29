import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const files = {
  activity: await readFile(resolve(root, 'soul-sentinel/app/src/main/java/com/divibisoul/soul/SoulHybridActivity.kt'), 'utf8'),
  events: await readFile(resolve(root, 'soul-sentinel/app/src/main/java/com/divibisoul/soul/core/SoulEvent.kt'), 'utf8'),
  collector: await readFile(resolve(root, 'soul-sentinel/app/src/main/java/com/divibisoul/soul/core/SystemEventCollector.kt'), 'utf8'),
  project: await readFile(resolve(root, 'src/core/neural/ProjetoClareira.ts'), 'utf8'),
  hook: await readFile(resolve(root, 'src/hooks/useProjetoClareira.ts'), 'utf8'),
  bridge: await readFile(resolve(root, 'src/core/neural/ClareiraSaraBridge.ts'), 'utf8'),
};

assert.match(files.events, /data class DeviceSnapshot/);
assert.match(files.collector, /publishDeviceSnapshot/);
assert.match(files.collector, /EXTRA_TEMPERATURE/);
assert.match(files.activity, /SystemEventCollector/);
assert.match(files.activity, /SoulEvent\.DeviceSnapshot/);
assert.match(files.activity, /soul:device-state/);
assert.match(files.project, /updateDeviceState/);
assert.match(files.project, /deviceState:/);
assert.match(files.hook, /addEventListener\('soul:device-state'/);
assert.match(files.hook, /removeEventListener\('soul:device-state'/);
assert.match(files.bridge, /\/vagus\/pending/);
assert.match(files.bridge, /\/vagus\/ack/);
assert.doesNotMatch(files.bridge, /const commandEnvelope = payload/);

console.log('CLAREIRA_ANDROID_CONTRACT: ok=true native_snapshot=true webview_ingress=true vagal_ack=true');
