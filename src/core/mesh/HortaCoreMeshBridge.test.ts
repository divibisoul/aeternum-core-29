import { strict as assert } from 'node:assert';
import test from 'node:test';
import { HortaCore } from '../hortaCore';
import { HortaCoreMeshBridge } from './HortaCoreMeshBridge';

const message:any={protocol:'soul-mesh/1',contractVersion:'1.1.0',id:'m1',correlationId:'c1',source:'N01',target:'N02',kind:'event',capability:'mesh.test',payload:{ok:true},timestamp:Date.now()};

test('HortaCore vascular layer tracks pressure, flow and backpressure',()=>{
  const h=new HortaCore();
  const vessel=h.ensureVessel('N01','N02',{capacityBytes:10,resistance:2});
  assert.equal(vessel.lastPressure,1);
  const pulse=h.beginVascularPulse({source:'N01',target:'N02',bytes:4,correlationId:'c1'});
  assert.equal(h.getVessel(vessel.id)?.inFlightBytes,4);
  assert.equal(h.getVessel(vessel.id)?.lastPerfusionIndex,0.3);
  h.completeVascularPulse(pulse.id,'completed');
  assert.equal(h.vascularHealth().completedPulses,1);
  const first=h.beginVascularPulse({source:'N01',target:'N02',bytes:10});
  assert.throws(()=>h.beginVascularPulse({source:'N01',target:'N02',bytes:1}),/HORTA_VESSEL_BACKPRESSURE/);
  h.completeVascularPulse(first.id,'failed','test');
  assert.equal(h.vascularHealth().rejectedPulses,1);
});
test('HortaCore Mesh bridge records real message circulation hooks',()=>{
  const h=new HortaCore(); const b=new HortaCoreMeshBridge(h);
  const receipt=b.beforeSend(message);
  b.afterSend(message,receipt);
  b.onReceive({...message,id:'m2',correlationId:'c2',source:'N02',target:'N01'});
  const health=h.vascularHealth();
  assert.equal(health.completedPulses,2);
  assert.equal(health.vesselCount,2);
});
