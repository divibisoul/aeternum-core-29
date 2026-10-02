export const LETTA_CODE_CAPABILITY='memory.identity.letta-code@1.0.0' as const;
export const LETTA_CODE_REVISION='1fcc9666817ab852bc2532a3a989f712e1fd6c19' as const;
export type LettaState='PASS'|'FAIL'|'DEGRADED';

export interface LettaRequest{
  operation?:'status'|'pull';
  agentId?:string;
}

export interface LettaEvidence{
  state:LettaState;
  code?:string;
  provider:'letta-ai/letta-code';
  revision:typeof LETTA_CODE_REVISION;
  configuredRoot:string;
  enabled:boolean;
  serverAdapterRequired:boolean;
}

const env=(name:string,fallback='')=>(typeof import.meta!=='undefined' && (import.meta as any).env?.[name] !== undefined
  ? String((import.meta as any).env[name])
  : fallback).trim();

const enabled=()=>/^(1|true|yes)$/i.test(env('VITE_SOUL_N01_LETTA_ENABLED'));

export function describeLettaCodeAdapter():LettaEvidence{
  const configuredRoot=env('VITE_SOUL_N01_LETTA_ROOT','integrations/soul-upstream/letta-code');
  if(!enabled()) {
    return {
      state:'DEGRADED',
      code:'LETTA_ADAPTER_DISABLED',
      provider:'letta-ai/letta-code',
      revision:LETTA_CODE_REVISION,
      configuredRoot,
      enabled:false,
      serverAdapterRequired:true,
    };
  }
  return {
    state:'DEGRADED',
    code:'LETTA_SERVER_ADAPTER_REQUIRED',
    provider:'letta-ai/letta-code',
    revision:LETTA_CODE_REVISION,
    configuredRoot,
    enabled:true,
    serverAdapterRequired:true,
  };
}

/**
 * N01 is browser/Vite runtime. Letta Code is a Node/CLI provider and must
 * execute behind a server-side adapter. This function intentionally refuses
 * to claim execution until that boundary exists.
 */
export async function runLettaCode(_request:LettaRequest={}):Promise<Record<string,unknown>>{
  const evidence=describeLettaCodeAdapter();
  return {
    ...evidence,
    capability:LETTA_CODE_CAPABILITY,
    state:'DEGRADED',
    code:evidence.code==='LETTA_ADAPTER_DISABLED'
      ? evidence.code
      : 'LETTA_SERVER_ADAPTER_REQUIRED',
  };
}
