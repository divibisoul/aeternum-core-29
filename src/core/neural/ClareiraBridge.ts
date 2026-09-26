/** Clareira ↔ N01 integration bridge. Uses the existing ProjetoClareira runtime and EventBus. */
import { EventBus } from '../EventBus';
import { ProjetoClareira } from './ProjetoClareira';
import { isClareiraPacket, type ClareiraMetrics, type ClareiraPacket } from '../../../shared/clareira-contract';
import type { InformationPacket } from './types';
let installed=false, startedAt=Date.now(), ingested=0, processed=0, dropped=0, errored=0, inFlight=0, lastLatency=0;
const latencySamples:number[]=[]; const subscriptions:Array<()=>void>=[];
const sampleLatency=(v:number)=>{lastLatency=Math.max(0,v);latencySamples.push(lastLatency);if(latencySamples.length>256)latencySamples.shift();};
export const ClareiraBridge={
  install(){if(installed)return; startedAt=Date.now(); subscriptions.push(
    EventBus.on('clareira.packet.ingested',()=>{ingested++;inFlight++;}),
    EventBus.on('clareira.packet.processed',({latencyMs})=>{processed++;inFlight=Math.max(0,inFlight-1);sampleLatency(latencyMs);}),
    EventBus.on('clareira.packet.dropped',()=>{dropped++;inFlight=Math.max(0,inFlight-1);}),
    EventBus.on('system:error',()=>{errored++;}),
  ); installed=true; void EventBus.emit('clareira.started',{at:startedAt});},
  uninstall(){while(subscriptions.length)subscriptions.pop()!();installed=false;},
  async ingest(packet:ClareiraPacket){if(!isClareiraPacket(packet))throw new Error('INVALID_CLAREIRA_PACKET');if(!installed)this.install();if(!ProjetoClareira.running)ProjetoClareira.start();
    const localPacket:InformationPacket={id:packet.id,data:packet.data,informationalValue:packet.informationalValue,criticality:packet.criticality,packetType:packet.packetType,sourceId:packet.sourceId,destinationHint:packet.destinationHint,timestamp:packet.timestamp,metadata:{...packet.metadata,correlationId:packet.correlationId,clareiraContractVersion:'1.0.0'}};
    return ProjetoClareira.injectPacket(localPacket);},
  metrics():ClareiraMetrics{if(!installed)this.install();const s=ProjetoClareira.getStatus(),a=[...latencySamples].sort((x,y)=>x-y),pct=(p:number)=>a.length?a[Math.min(a.length-1,Math.floor((a.length-1)*p))]:0;return{capturedAtMs:Date.now(),nodes:{total:s.nodes.length,active:s.nodes.filter(n=>n.active).length,errored},channels:{total:s.channels.length,open:s.channels.filter(c=>c.active).length},packets:{ingested,processed,dropped,errored,inFlight},latencyMs:{last:lastLatency,p50:pct(.5),p95:pct(.95),max:a[a.length-1]??0},uptimeMs:s.uptime};}
};
export type { ClareiraPacket, ClareiraMetrics };