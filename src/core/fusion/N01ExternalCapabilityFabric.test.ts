import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  N01_EXTERNAL_PROVIDERS,
  canonicalOwnerForExternalProvider,
  describeN01ExternalCapabilityFabric,
  findN01ExternalProvidersByCapability,
  resolveN01ExternalProvider,
} from './N01ExternalCapabilityFabric';

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), 'integrations/soul-25-augmentation.json'), 'utf8'),
) as {
  external_provider_count: number;
  external_providers: Array<{
    id: string;
    source: string;
    revision: string;
    owner: string;
    targets: string[];
    capabilities: string[];
    direct_affinity: boolean;
    runtime_state: string;
    requires_adapter: boolean;
  }>;
  soul_peer_count: number;
  soul_peers: string[];
  native_authority: string;
};

test('N01 fabric matches all 25 public providers pinned in the canonical manifest', () => {
  assert.equal(manifest.external_provider_count, 25);
  assert.equal(manifest.external_providers.length, 25);
  assert.equal(N01_EXTERNAL_PROVIDERS.length, 25);
  assert.equal(new Set(N01_EXTERNAL_PROVIDERS.map((provider) => provider.id)).size, 25);
  assert.equal(manifest.soul_peer_count, 9);
  assert.equal(manifest.soul_peers.length, 9);
  assert.equal(manifest.native_authority, 'preserved');

  const byId = new Map(N01_EXTERNAL_PROVIDERS.map((provider) => [provider.id, provider]));
  for (const expected of manifest.external_providers) {
    const actual = byId.get(expected.id);
    assert.ok(actual, `missing fabric provider ${expected.id}`);
    assert.equal(actual.source, expected.source, `${expected.id} source URL drift`);
    assert.equal(actual.revision, expected.revision, `${expected.id} pinned revision drift`);
    assert.equal(actual.owner, expected.owner, `${expected.id} canonical owner drift`);
    assert.deepEqual(actual.targets, expected.targets, `${expected.id} target drift`);
    assert.deepEqual(actual.capabilities, expected.capabilities, `${expected.id} capability drift`);
    assert.equal(actual.directAffinity, expected.direct_affinity, `${expected.id} direct-affinity drift`);
    assert.equal(expected.runtime_state, 'PROJECTED', `${expected.id} must not claim runtime success without provider E2E`);
    assert.equal(expected.requires_adapter, true, `${expected.id} requires an explicit adapter`);
    assert.match(actual.source, /^https:\/\/github\.com\//);
    assert.match(actual.revision, /^[0-9a-f]{40}$/i);
    assert.equal(actual.state, 'PROJECTED');
  }
});

test('N01 capability lookup preserves canonical native ownership and direct affinity', () => {
  assert.equal(canonicalOwnerForExternalProvider('LETTA-CODE'), 'N01');
  assert.equal(resolveN01ExternalProvider('langgraph').owner, 'N07');
  assert.equal(resolveN01ExternalProvider('whisper').owner, 'N03');
  assert.equal(resolveN01ExternalProvider('llama-index').owner, 'N05');
  assert.deepEqual(
    findN01ExternalProvidersByCapability('speech').map((provider) => provider.id),
    ['whisper', 'kokoro'],
  );
  assert.equal(findN01ExternalProvidersByCapability('').length, 25);
});

test('N01 reports provider metadata separately from runtime execution evidence', () => {
  const description = describeN01ExternalCapabilityFabric();
  assert.equal(description.structuralState, 'REAL');
  assert.equal(description.runtimeState, 'PROJECTED_UNTIL_PROVIDER_E2E');
  assert.equal(description.liveExecutionProven, false);
  assert.equal(description.runtimeVerifiedProviderCount, 0);
  assert.equal(description.byState.PROJECTED, 25);
  assert.equal(description.byState.READY, 0);
});

test('unknown external provider is blocked before routing', () => {
  assert.throws(
    () => resolveN01ExternalProvider('provider-that-does-not-exist'),
    /N01_EXTERNAL_PROVIDER_UNKNOWN/,
  );
});
