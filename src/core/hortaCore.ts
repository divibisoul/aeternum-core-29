/**
 * hortaCore — memória central de estado do Aeternum.
 * Não é persistência de disco. É estado em memória com observadores.
 * Complementa (não substitui) qualquer store já existente no N01.
 *
 * A mudança registrada aqui é funcional: além do valor atual, cada alteração
 * recebe uma sequência monotônica e entra no changelog para rastreabilidade.
 */

export interface HortaChange {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
  sequence: number;
}


export type HortaVascularDirection = 'inbound' | 'outbound';
export type HortaVascularOutcome = 'started' | 'completed' | 'failed' | 'rejected';
export interface HortaVessel {
  id:string; source:string; target:string; direction:HortaVascularDirection;
  capacityBytes:number; resistance:number; inFlightBytes:number;
  totalPulses:number; completedPulses:number; failedPulses:number; rejectedPulses:number;
  totalBytes:number; totalDurationMs:number; lastPressure:number; lastPerfusionIndex:number;
  lastThroughputBytesPerSecond:number; lastPulseAt?:number;
}
export interface HortaVascularPulse {
  id:string; vesselId:string; source:string; target:string; direction:HortaVascularDirection;
  bytes:number; correlationId?:string; messageId?:string; kind?:string; capability?:string; startedAt:number;
}
export interface HortaVascularHealth {
  status:'HEALTHY'|'DEGRADED'; vesselCount:number; activePulses:number; inFlightBytes:number;
  totalPulses:number; completedPulses:number; failedPulses:number; rejectedPulses:number;
  utilization:number; pressure:number; perfusionIndex:number; throughputBytesPerSecond:number;
}

type ObserverCallback = (value: unknown, change: HortaChange) => void;
type Unsubscribe = () => void;

export class HortaCore {
  private readonly data = new Map<string, unknown>();
  private readonly observers = new Map<string, ObserverCallback[]>();
  private readonly allObservers = new Set<(change: HortaChange) => void>();
  private readonly changeLog: HortaChange[] = [];
  private readonly maxLog = 1000;
  private readonly vessels = new Map<string, HortaVessel>();
  private readonly activePulses = new Map<string, HortaVascularPulse>();
  private readonly completedFlowLog: Array<{pulse:HortaVascularPulse;outcome:HortaVascularOutcome;durationMs:number;error?:string}> = [];
  private readonly vascularMaxLog = 2000;
  private sequence = 0;
  private vascularSequence = 0;

  set<T>(key: string, value: T): HortaChange {
    const change: HortaChange = {
      key,
      oldValue: this.data.get(key),
      newValue: value,
      timestamp: Date.now(),
      sequence: ++this.sequence,
    };

    this.data.set(key, value);
    this.changeLog.push(change);
    if (this.changeLog.length > this.maxLog) this.changeLog.shift();

    for (const observer of [...(this.observers.get(key) ?? [])]) {
      try {
        observer(value, change);
      } catch (error) {
        console.error(`[hortaCore] observer error em "${key}"`, error);
      }
    }

    for (const observer of [...this.allObservers]) {
      try {
        observer(change);
      } catch (error) {
        console.error('[hortaCore] global observer error', error);
      }
    }

    return change;
  }

  get<T = unknown>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  delete(key: string): void {
    this.data.delete(key);
  }

  observe(key: string, cb: ObserverCallback): Unsubscribe {
    const observers = this.observers.get(key) ?? [];
    observers.push(cb);
    this.observers.set(key, observers);

    return () => {
      const current = this.observers.get(key);
      if (!current) return;
      const index = current.indexOf(cb);
      if (index >= 0) current.splice(index, 1);
      if (current.length === 0) this.observers.delete(key);
    };
  }

  observeAll(cb: (change: HortaChange) => void): Unsubscribe {
    this.allObservers.add(cb);
    return () => this.allObservers.delete(cb);
  }

  keys(): string[] {
    return [...this.data.keys()].sort();
  }

  snapshot(): Record<string, unknown> {
    return Object.fromEntries(this.data.entries());
  }

  getChangeLog(): HortaChange[] {
    return [...this.changeLog];
  }


  ensureVessel(source:string,target:string,options:{capacityBytes?:number;resistance?:number;direction?:HortaVascularDirection}={}):HortaVessel{
    const s=String(source).trim(), t=String(target).trim();
    if(!s||!t||s===t) throw new Error('HORTA_INVALID_VESSEL_ENDPOINTS');
    const direction=options.direction??'outbound';
    const id=`artery:${s}->${t}:${direction}`;
    const existing=this.vessels.get(id); if(existing) return {...existing};
    const capacity=Number.isFinite(options.capacityBytes)&&Number(options.capacityBytes)>0?Math.floor(Number(options.capacityBytes)):1024*1024;
    const resistance=Number.isFinite(options.resistance)&&Number(options.resistance)>0?Number(options.resistance):1;
    const vessel:HortaVessel={id,source:s,target:t,direction,capacityBytes:Math.max(1,capacity),resistance,inFlightBytes:0,totalPulses:0,completedPulses:0,failedPulses:0,rejectedPulses:0,totalBytes:0,totalDurationMs:0,lastPressure:1,lastPerfusionIndex:1,lastThroughputBytesPerSecond:0};
    this.vessels.set(id,vessel); this.set(`vascular.vessel.${id}.state`,'HEALTHY'); return {...vessel};
  }

  getVessel(id:string):HortaVessel|undefined{const v=this.vessels.get(id);return v?{...v}:undefined;}
  listVessels():HortaVessel[]{return [...this.vessels.values()].map(v=>({...v}));}

  beginVascularPulse(input:{source:string;target:string;direction?:HortaVascularDirection;bytes:number;correlationId?:string;messageId?:string;kind?:string;capability?:string;capacityBytes?:number;resistance?:number}):HortaVascularPulse{
    const bytes=Math.max(1,Math.floor(Number.isFinite(input.bytes)&&input.bytes>=0?input.bytes:0));
    const vessel=this.ensureVessel(input.source,input.target,{direction:input.direction,capacityBytes:input.capacityBytes,resistance:input.resistance});
    if((vessel.inFlightBytes+bytes)/vessel.capacityBytes>1){
      vessel.rejectedPulses++; this.vessels.set(vessel.id,vessel); this.set(`vascular.vessel.${vessel.id}.state`,'BACKPRESSURED');
      throw new Error(`HORTA_VESSEL_BACKPRESSURE:${vessel.id}`);
    }
    vessel.inFlightBytes+=bytes; vessel.totalPulses++; vessel.lastPulseAt=Date.now();
    const util=Math.min(1,vessel.inFlightBytes/vessel.capacityBytes); vessel.lastPressure=1-util; vessel.lastPerfusionIndex=vessel.lastPressure/vessel.resistance;
    this.vessels.set(vessel.id,vessel);
    const pulse:HortaVascularPulse={id:`pulse-${++this.vascularSequence}`,vesselId:vessel.id,source:vessel.source,target:vessel.target,direction:input.direction??'outbound',bytes,correlationId:input.correlationId,messageId:input.messageId,kind:input.kind,capability:input.capability,startedAt:Date.now()};
    this.activePulses.set(pulse.id,pulse); this.set(`vascular.pulse.${pulse.id}.state`,'started'); return {...pulse};
  }

  completeVascularPulse(pulseId:string,outcome:Exclude<HortaVascularOutcome,'started'|'rejected'>,error?:string):HortaVascularPulse|undefined{
    const pulse=this.activePulses.get(pulseId); if(!pulse)return;
    const vessel=this.vessels.get(pulse.vesselId); if(!vessel){this.activePulses.delete(pulseId);return;}
    const duration=Math.max(0,Date.now()-pulse.startedAt);
    vessel.inFlightBytes=Math.max(0,vessel.inFlightBytes-pulse.bytes); vessel.totalBytes+=pulse.bytes; vessel.totalDurationMs+=duration;
    if(outcome==='completed') vessel.completedPulses++; else vessel.failedPulses++;
    vessel.lastThroughputBytesPerSecond=duration>0?pulse.bytes/(duration/1000):pulse.bytes;
    const util=Math.min(1,vessel.inFlightBytes/vessel.capacityBytes); vessel.lastPressure=1-util; vessel.lastPerfusionIndex=vessel.lastPressure/vessel.resistance;
    this.vessels.set(vessel.id,vessel); this.activePulses.delete(pulseId);
    this.completedFlowLog.push({pulse:{...pulse},outcome,durationMs:duration,...(error?{error}:{})});
    if(this.completedFlowLog.length>this.vascularMaxLog)this.completedFlowLog.shift();
    this.set(`vascular.pulse.${pulse.id}.state`,outcome); if(error)this.set(`vascular.pulse.${pulse.id}.error`,error); return {...pulse};
  }

  vascularHealth():HortaVascularHealth{
    const vs=this.listVessels(), active=this.activePulses.size;
    const inFlightBytes=vs.reduce((s,v)=>s+v.inFlightBytes,0), totalPulses=vs.reduce((s,v)=>s+v.totalPulses,0), completedPulses=vs.reduce((s,v)=>s+v.completedPulses,0), failedPulses=vs.reduce((s,v)=>s+v.failedPulses,0), rejectedPulses=vs.reduce((s,v)=>s+v.rejectedPulses,0);
    const utilization=vs.length?vs.reduce((s,v)=>s+v.inFlightBytes/v.capacityBytes,0)/vs.length:0;
    const pressure=vs.length?vs.reduce((s,v)=>s+v.lastPressure,0)/vs.length:1;
    const perfusionIndex=vs.length?vs.reduce((s,v)=>s+v.lastPerfusionIndex,0)/vs.length:1;
    const totalBytes=vs.reduce((s,v)=>s+v.totalBytes,0), totalDurationMs=vs.reduce((s,v)=>s+v.totalDurationMs,0);
    return {status:pressure<0.1?'DEGRADED':'HEALTHY',vesselCount:vs.length,activePulses:active,inFlightBytes,totalPulses,completedPulses,failedPulses,rejectedPulses,utilization,pressure,perfusionIndex,throughputBytesPerSecond:totalDurationMs?totalBytes/(totalDurationMs/1000):0};
  }

  getVascularFlowLog(){return this.completedFlowLog.map(e=>({pulse:{...e.pulse},outcome:e.outcome,durationMs:e.durationMs,...(e.error?{error:e.error}:{})}));}

  clear(): void {
    this.data.clear();
    this.observers.clear();
    this.allObservers.clear();
    this.changeLog.length = 0;
    this.vessels.clear(); this.activePulses.clear(); this.completedFlowLog.length = 0;
    this.sequence = 0; this.vascularSequence = 0;
  }
}

export const hortaCore = new HortaCore();
