import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer as createViteServer } from 'vite';

const topology = JSON.parse(await readFile(new URL('../config/soul-neocortex-topology.json', import.meta.url), 'utf8'));
const runtimeSource = await readFile(new URL('../src/core/mesh/SoulMeshRuntime.ts', import.meta.url), 'utf8');

if (topology.branches.length !== 7) throw new Error('NEOCORTEX_REQUIRES_SEVEN_NUCLEI');
if (topology.executiveFunctions.length < 8) throw new Error('NEOCORTEX_EXECUTIVE_FUNCTIONS_INCOMPLETE');
if (topology.individualNucleiPreserved !== true) throw new Error('NUCLEUS_INDEPENDENCE_MUST_BE_PRESERVED');
if (topology.hardwareGpu !== false) throw new Error('TOPOLOGY_MUST_NOT_CLAIM_HARDWARE_GPU');
if (!runtimeSource.includes('agents.register(createN01PrefrontalOptimizerAgent())')) {
  throw new Error('N01_PREFRONTAL_AGENT_NOT_REGISTERED_IN_NATIVE_REGISTRY');
}
if (!runtimeSource.includes('router.onRequest(N01_PREFRONTAL_OPTIMIZE_CAPABILITY, prefrontalAgentHandler)')) {
  throw new Error('N01_PREFRONTAL_CAPABILITY_NOT_EXPOSED_THROUGH_MESH');
}
if (!runtimeSource.includes('new ProcessorRuntime(prefrontalProcessor')) {
  throw new Error('N01_PREFRONTAL_AGENT_RUNTIME_NOT_COMMISSIONED');
}

const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const [agentModule, registryModule, protocolModule, legacyCortexModule] = await Promise.all([
    vite.ssrLoadModule('/src/soul-fusion/N01PrefrontalAgent.ts'),
    vite.ssrLoadModule('/src/core/mesh/N01AgentRegistry.ts'),
    vite.ssrLoadModule('/src/core/mesh/SoulMeshProtocol.ts'),
    vite.ssrLoadModule('/scripts/soul-neocortex.mjs'),
  ]);

  const {
    createN01PrefrontalOptimizerAgent,
    N01_PREFRONTAL_OPTIMIZE_CAPABILITY,
  } = agentModule;
  const { N01AgentRegistry } = registryModule;
  const { createSoulMeshMessage } = protocolModule;

  // The legacy planner must abstain when no remote owner/heartbeat has been
  // observed. This forwarding function deliberately fails on invocation; it
  // is not used as evidence of execution success.
  let remoteForwardCalls = 0;
  const legacy = legacyCortexModule.createNeoCortex({
    resolveOwner: () => null,
    forward: async () => {
      remoteForwardCalls += 1;
      throw new Error('REMOTE_ENDPOINT_NOT_CONFIGURED');
    },
  });
  legacy.addGoal({
    id: 'unverified-remote',
    description: 'unknown remote capability must be inhibited',
    priority: 1,
    requiredCapabilities: ['cognitive.synthesize'],
  });
  const blockedRemote = legacy.decide('unverified-remote');
  assert.equal(blockedRemote.inhibited, true);
  assert.equal(blockedRemote.selectedNucleus, undefined);
  assert.equal(remoteForwardCalls, 0);

  const registry = new N01AgentRegistry();
  const agent = createN01PrefrontalOptimizerAgent();
  registry.register(agent);
  const message = createSoulMeshMessage({
    source: 'N02',
    target: 'N01',
    kind: 'request',
    capability: N01_PREFRONTAL_OPTIMIZE_CAPABILITY,
    payload: {
      goalId: 'neocortex-check.mesh-correlation',
      description: 'Reduce fragility at the Mesh trace/correlation and retry boundary',
      weakPoint: 'mesh trace correlation retry idempotency',
      priority: 0.9,
      context: { check: 'neocortex:check', additiveOnly: true },
    },
    correlationId: 'corr-neocortex-check-001',
    meta: { traceId: 'trace-neocortex-check-001' },
  });
  const response = await registry.execute(message);

  assert.equal(response.status, 'completed');
  assert.equal(response.agentId, 'N01.neocortex-prefrontal-optimizer');
  assert.equal(response.correlationId, message.correlationId);
  assert.equal(response.traceId, message.meta.traceId);
  assert.equal(response.decision.inhibited, false);
  assert.equal(response.decision.selectedNucleus, 'N01');
  assert.equal(response.execution.backend, 'IN_PROCESS');
  assert.equal(response.execution.nucleus, 'N01');
  assert.ok(Number.isFinite(response.execution.latencyMs));
  assert.ok(response.optimization.actions.some((action) => action.id === 'preserve-correlation'));
  assert.equal(response.cortex.activeNuclei, 1);
  assert.equal(response.cortex.gpuFabric.hardwareGpu, false);
  assert.equal(response.cortex.cognitiveFabric.agents, 1);
  assert.equal(remoteForwardCalls, 0);

  let rejectedUnknownCapability = false;
  try {
    await registry.execute(createSoulMeshMessage({
      source: 'N02',
      target: 'N01',
      kind: 'request',
      capability: 'neural.prefrontal.unknown@1.0.0',
      payload: { description: 'must fail closed' },
      correlationId: 'corr-neocortex-unknown-001',
      meta: { traceId: 'trace-neocortex-unknown-001' },
    }));
  } catch (error) {
    rejectedUnknownCapability = String(error).includes('AGENT_NOT_FOUND');
  }
  assert.equal(rejectedUnknownCapability, true, 'unregistered capability must be rejected');

  console.log(JSON.stringify({
    state: 'PASS',
    proofBoundary: 'N01 native agent registry + real NeoCortexPrefrontal/SoulNeuralGraph/SoulSuperGPU IN_PROCESS execution',
    liveMeshE2E: 'NOT_RUN_NO_REMOTE_ENDPOINTS',
    remoteAvailability: 'UNVERIFIED',
    legacyRemoteFailClosed: blockedRemote.reason,
    remoteForwardCalls,
    agent: response.agentId,
    capability: N01_PREFRONTAL_OPTIMIZE_CAPABILITY,
    rootTraceId: response.traceId,
    correlationId: response.correlationId,
    selectedNucleus: response.decision.selectedNucleus,
    executionBackend: response.execution.backend,
    latencyMs: response.execution.latencyMs,
    actionCount: response.optimization.actions.length,
    activeNuclei: response.cortex.activeNuclei,
    hardwareGpu: response.cortex.gpuFabric.hardwareGpu,
  }, null, 2));
} finally {
  await vite.close();
}
