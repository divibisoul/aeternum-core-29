import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { describeLettaCodeAdapter } from './LettaCodeAdapter';

describe('N01 Letta Code adapter boundary',()=>{
  test('disabled remains DEGRADED',()=>{
    const original=process.env.SOUL_N01_LETTA_ENABLED;
    delete process.env.SOUL_N01_LETTA_ENABLED;
    try { assert.equal(describeLettaCodeAdapter().state,'DEGRADED'); }
    finally {
      if(original===undefined) delete process.env.SOUL_N01_LETTA_ENABLED;
      else process.env.SOUL_N01_LETTA_ENABLED=original;
    }
  });
  test('missing source remains DEGRADED',()=>{
    const oldE=process.env.SOUL_N01_LETTA_ENABLED,oldR=process.env.SOUL_N01_LETTA_ROOT;
    process.env.SOUL_N01_LETTA_ENABLED='true'; process.env.SOUL_N01_LETTA_ROOT='/definitely/missing/letta';
    try { assert.equal(describeLettaCodeAdapter().code,'LETTA_SOURCE_NOT_AVAILABLE'); }
    finally {
      if(oldE===undefined) delete process.env.SOUL_N01_LETTA_ENABLED; else process.env.SOUL_N01_LETTA_ENABLED=oldE;
      if(oldR===undefined) delete process.env.SOUL_N01_LETTA_ROOT; else process.env.SOUL_N01_LETTA_ROOT=oldR;
    }
  });
});
