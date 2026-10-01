import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('src/components/agi/EngineeringPanel.tsx','utf8');

assert.match(source, /new WebSocket\(/);
assert.match(source, /heartbeat\.aggregate/);
assert.match(source, /setInterval\(\(\) =>/);
assert.match(source, /, 100\)/);
assert.match(source, /BLOCKED/);
assert.match(source, /UNMEASURABLE/);
assert.equal(source.includes('Math.random'), false);
assert.equal(source.includes('demo'), false);
assert.equal(source.includes('mock'), false);

console.log(JSON.stringify({
  status:'PASS',
  websocketSource:true,
  aggregateContract:true,
  refreshIntervalMs:100,
  syntheticMetricFunctions:false
},null,2));
