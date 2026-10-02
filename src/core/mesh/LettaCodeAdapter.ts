import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

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
  root:string;
  enabled:boolean;
  sourcePresent:boolean;
  packagePresent:boolean;
  cliPresent:boolean;
}

const env=(name:string,fallback='')=>(process.env[name]??fallback).trim();
const enabled=()=>/^(1|true|yes)$/i.test(env('SOUL_N01_LETTA_ENABLED'));

function config(){
  return {
    root:path.resolve(env('SOUL_N01_LETTA_ROOT','integrations/soul-upstream/letta-code')),
    cli:env('SOUL_N01_LETTA_CLI','letta'),
    python:env('SOUL_N01_LETTA_NODE','node'),
    timeoutMs:Math.max(5000,Number.parseInt(env('SOUL_N01_LETTA_TIMEOUT_MS','30000'),10)||30000),
  };
}

export function describeLettaCodeAdapter():LettaEvidence{
  const c=config();
  const sourcePresent=fs.existsSync(c.root)&&fs.statSync(c.root).isDirectory();
  const packagePresent=fs.existsSync(path.join(c.root,'package.json'));
  const cliPresent=packagePresent;
  if(!enabled())return {state:'DEGRADED',code:'LETTA_ADAPTER_DISABLED',provider:'letta-ai/letta-code',revision:LETTA_CODE_REVISION,root:c.root,enabled:false,sourcePresent,packagePresent,cliPresent};
  if(!sourcePresent||!packagePresent)return {state:'DEGRADED',code:'LETTA_SOURCE_NOT_AVAILABLE',provider:'letta-ai/letta-code',revision:LETTA_CODE_REVISION,root:c.root,enabled:true,sourcePresent,packagePresent,cliPresent:false};
  return {state:'DEGRADED',code:'LETTA_CLI_RUNTIME_NOT_YET_PROVEN',provider:'letta-ai/letta-code',revision:LETTA_CODE_REVISION,root:c.root,enabled:true,sourcePresent:true,packagePresent:true,cliPresent};
}

export async function runLettaCode(request:LettaRequest={}):Promise<Record<string,unknown>>{
  const evidence=describeLettaCodeAdapter();
  if(evidence.state!=='DEGRADED'||evidence.code!=='LETTA_CLI_RUNTIME_NOT_YET_PROVEN')return {...evidence,capability:LETTA_CODE_CAPABILITY};
  const c=config();
  const agentId=(request.agentId||env('LETTA_AGENT_ID')).trim();
  if(!agentId)return {...evidence,state:'FAIL',code:'LETTA_AGENT_ID_REQUIRED',capability:LETTA_CODE_CAPABILITY};
  const operation=request.operation==='pull'?'pull':'status';
  const args=['memory',operation,'--agent',agentId];
  const child=spawn(c.cli,args,{cwd:c.root,stdio:['ignore','pipe','pipe']});
  let stdout='',stderr=''; child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
  child.stdout.on('data',x=>stdout+=x); child.stderr.on('data',x=>stderr+=x);
  const result=await new Promise<{code:number|null;signal:NodeJS.Signals|null}>((resolve,reject)=>{
    const timer=setTimeout(()=>{child.kill('SIGTERM');reject(new Error('LETTA_TIMEOUT'));},c.timeoutMs);
    child.once('error',e=>{clearTimeout(timer);reject(e)});
    child.once('exit',(code,signal)=>{clearTimeout(timer);resolve({code,signal})});
  }).catch(error=>({code:null,signal:null,error}));
  if('error'in result&&result.error){
    const detail=result.error instanceof Error?result.error.message:String(result.error);
    return {...evidence,state:'DEGRADED',code:detail==='LETTA_TIMEOUT'?'LETTA_TIMEOUT':'LETTA_CLI_UNAVAILABLE',detail,capability:LETTA_CODE_CAPABILITY};
  }
  if(result.code!==0)return {...evidence,state:'FAIL',code:'LETTA_CLI_COMMAND_FAILED',exitCode:result.code,signal:result.signal,stderr:stderr.slice(-4000),stdout:stdout.slice(-4000),capability:LETTA_CODE_CAPABILITY};
  return {...evidence,state:'PASS',operation,agentId,stdout:stdout.slice(-8000),stderr:stderr.slice(-4000),capability:LETTA_CODE_CAPABILITY,providerRevision:LETTA_CODE_REVISION};
}
