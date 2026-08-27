export const NUCLEUS_ID = 'N01' as const;
export const TRANSPORTS = ['IN_PROCESS','WEBVIEW_BRIDGE','LOOPBACK_HTTP','HTTP','REALTIME'] as const;
export type TransportKind = typeof TRANSPORTS[number];
export type TransportStatus = 'native' | 'adapter' | 'available-via-peer' | 'unavailable';
export interface TransportDescriptor { kind: TransportKind; status: TransportStatus; bidirectional: boolean; priority: number; }
export const N01_TRANSPORT_REGISTRY: readonly TransportDescriptor[] = [
  {kind:'IN_PROCESS',status:'native',bidirectional:true,priority:1},
  {kind:'WEBVIEW_BRIDGE',status:'native',bidirectional:true,priority:2},
  {kind:'LOOPBACK_HTTP',status:'native',bidirectional:true,priority:3},
  {kind:'HTTP',status:'native',bidirectional:true,priority:4},
  {kind:'REALTIME',status:'native',bidirectional:true,priority:5},
];
export function rankCompatible(local:readonly TransportKind[],remote:readonly TransportKind[]):TransportKind|null {
  return [...N01_TRANSPORT_REGISTRY].sort((a,b)=>a.priority-b.priority).find(t=>local.includes(t.kind)&&remote.includes(t.kind))?.kind ?? null;
}
