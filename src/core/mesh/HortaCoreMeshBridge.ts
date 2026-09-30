import type { SoulMeshMessage } from './SoulMeshProtocol';
import { hortaCore } from '../hortaCore';
import type { SoulMeshTrafficObserver } from './SoulMeshRouter';

function messageBytes(message:SoulMeshMessage):number{
  try{return Math.max(1,new TextEncoder().encode(JSON.stringify(message)).byteLength);}catch{return 1;}
}
export class HortaCoreMeshBridge implements SoulMeshTrafficObserver{
  constructor(private readonly state=hortaCore){}
  beforeSend(message:SoulMeshMessage){return this.state.beginVascularPulse({source:message.source,target:message.target,direction:'outbound',bytes:messageBytes(message),correlationId:message.correlationId,messageId:message.id,kind:message.kind,capability:message.capability});}
  afterSend(message:SoulMeshMessage,receipt:unknown,error?:unknown){
    const pulse=receipt as {id?:string}|undefined;
    if(!pulse?.id)return;
    this.state.completeVascularPulse(pulse.id,error?'failed':'completed',error instanceof Error?error.message:error?String(error):undefined);
    this.state.set(`vascular.mesh.${message.id}.status`,error?'failed':'completed');
  }
  onReceive(message:SoulMeshMessage){
    try{
      const pulse=this.state.beginVascularPulse({source:message.source,target:message.target,direction:'inbound',bytes:messageBytes(message),correlationId:message.correlationId,messageId:message.id,kind:message.kind,capability:message.capability});
      this.state.completeVascularPulse(pulse.id,'completed');
      this.state.set(`vascular.mesh.${message.id}.status`,'completed');
    }catch(error){
      this.state.set(`vascular.mesh.${message.id}.status`,'degraded');
      this.state.set(`vascular.mesh.${message.id}.error`,error instanceof Error?error.message:String(error));
    }
  }
}
