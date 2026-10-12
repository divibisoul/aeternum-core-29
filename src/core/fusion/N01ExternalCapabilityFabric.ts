export type N01ExternalProviderState = 'PROJECTED' | 'DEGRADED' | 'READY';
export type N01ExternalAdapterStatus = 'REGISTERED' | 'EXPANSION_ONLY' | 'UNREGISTERED';

export type N01ExternalProvider = {
  id: string;
  source: string;
  revision: string;
  owner: string;
  targets: readonly string[];
  capabilities: readonly string[];
  directAffinity: boolean;
  adapterOperations: readonly string[];
  runtimeAdapterStatus: N01ExternalAdapterStatus;
  state: N01ExternalProviderState;
};

/**
 * Manifest-aligned N01 catalogue. N07 remains the canonical external adapter
 * control plane; unknown/unregistered providers fail closed, and cataloguing
 * a pinned source never implies its runtime was executed.
 */
export const N01_EXTERNAL_PROVIDERS: readonly N01ExternalProvider[] = [
  {
    id: "superpowers",
    source: "https://github.com/obra/superpowers",
    revision: "8ca22dba9a94f28898bbce59f2537ff4d87c747d",
    owner: "N07",
    targets: ["N07"],
    capabilities: ["agentic-skills","subagents","planning","tdd","review","debugging"],
    directAffinity: false,
    adapterOperations: ["skills.read"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "superagi",
    source: "https://github.com/TransformerOptimus/SuperAGI",
    revision: "c3c1982e7bd6a11cfed53c5a193ea502f924b1b6",
    owner: "N07",
    targets: ["N07"],
    capabilities: ["autonomous-agents","tools","memory","multimodal","telemetry"],
    directAffinity: true,
    adapterOperations: ["agent.describe","agent.execute"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "langgraph",
    source: "https://github.com/langchain-ai/langgraph",
    revision: "2d942085e214ef6b99b6f54ed4d544a7c7c5ac56",
    owner: "N07",
    targets: ["N07","N01"],
    capabilities: ["stateful-agents","durable-workflows","orchestration"],
    directAffinity: true,
    adapterOperations: ["workflow.invoke"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "crewai",
    source: "https://github.com/crewAIInc/crewAI",
    revision: "1133f16cab274b9863b36fdacca7766b30e549fd",
    owner: "N07",
    targets: ["N07"],
    capabilities: ["multi-agent-crews","flows","role-specialization"],
    directAffinity: false,
    adapterOperations: ["team.execute"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "microsoft-agent-framework",
    source: "https://github.com/microsoft/agent-framework",
    revision: "b9d24c8fb484c8330abe8bb9e7500ca3c3bbf46c",
    owner: "N07",
    targets: ["N07"],
    capabilities: ["agents","workflows","MCP","A2A"],
    directAffinity: false,
    adapterOperations: ["agent.describe","workflow.describe","agent.execute"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "openhands",
    source: "https://github.com/OpenHands/OpenHands",
    revision: "81e83760a196ba6374ad2c3d38d577262c79ca2d",
    owner: "N06",
    targets: ["N06"],
    capabilities: ["software-agents","tool-use","execution"],
    directAffinity: false,
    adapterOperations: ["agent.describe","agent.execute"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "metagpt",
    source: "https://github.com/FoundationAgents/MetaGPT",
    revision: "11cdf466d042aece04fc6cfd13b28e1a70341b1f",
    owner: "N07",
    targets: ["N07"],
    capabilities: ["role-based-agents","multi-agent-collaboration","software-process"],
    directAffinity: false,
    adapterOperations: ["team.execute"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "agentscope",
    source: "https://github.com/agentscope-ai/agentscope",
    revision: "72f3f6fa0b2fc38b8517f408ab616f0f2bd229e6",
    owner: "N03",
    targets: ["N03","N07"],
    capabilities: ["agents","teams","tools","memory","sandbox","A2A","voice"],
    directAffinity: true,
    adapterOperations: ["agent.describe","agent.execute"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "letta-code",
    source: "https://github.com/letta-ai/letta-code",
    revision: "4b028fab07c69edaac2ddb4f7b9a43573ff20d81",
    owner: "N01",
    targets: ["N01"],
    capabilities: ["stateful-agents","persistent-memory","identity"],
    directAffinity: true,
    adapterOperations: ["agent.describe","memory.execute"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "browser-use",
    source: "https://github.com/browser-use/browser-use",
    revision: "7be96ed8bafa8dfe1eef228b59cf5c884b8b2431",
    owner: "N04",
    targets: ["N04"],
    capabilities: ["browser-agents","web-automation"],
    directAffinity: false,
    adapterOperations: ["browser.describe","browser.execute"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "smolagents",
    source: "https://github.com/huggingface/smolagents",
    revision: "c30b115286e000e98711fae5e85993547b73d826",
    owner: "N06",
    targets: ["N06"],
    capabilities: ["code-agents","tools","MCP","multimodal"],
    directAffinity: false,
    adapterOperations: ["agent.describe","agent.execute"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "pydantic-ai",
    source: "https://github.com/pydantic/pydantic-ai",
    revision: "cd99fbc21959731de84807724c997430115ce65e",
    owner: "N01",
    targets: ["N01","JEV"],
    capabilities: ["typed-agents","tools","subagents","durable-execution"],
    directAffinity: true,
    adapterOperations: ["agent.describe","agent.execute"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "llama-index",
    source: "https://github.com/run-llama/llama_index",
    revision: "81f0e06f6e61a5659bd409cac4a199e28c2fd85e",
    owner: "N05",
    targets: ["N05"],
    capabilities: ["RAG","indexing","retrieval","agent-workflows"],
    directAffinity: false,
    adapterOperations: ["retrieval.execute"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "dspy",
    source: "https://github.com/stanfordnlp/dspy",
    revision: "bc8af7ed3d5ee0b892211e5c03274396442a413c",
    owner: "N06",
    targets: ["N06"],
    capabilities: ["LM-programming","optimization","reasoning-pipelines"],
    directAffinity: false,
    adapterOperations: ["reasoning.execute"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "whisper",
    source: "https://github.com/openai/whisper",
    revision: "86098128c0b4f24f0e2aa2994de830614b474227",
    owner: "N03",
    targets: ["N03"],
    capabilities: ["speech-to-text"],
    directAffinity: false,
    adapterOperations: ["speech.transcribe"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "kokoro",
    source: "https://github.com/hexgrad/kokoro",
    revision: "dfb907a02bba8152ca444717ca5d78747ccb4bec",
    owner: "N03",
    targets: ["N03"],
    capabilities: ["text-to-speech"],
    directAffinity: false,
    adapterOperations: ["speech.synthesize"],
    runtimeAdapterStatus: "REGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "everything-claude-code",
    source: "https://github.com/affaan-m/ECC",
    revision: "ef648e01899ba3e8dc6371642deaaf64b4477775",
    owner: "N07",
    targets: ["N07"],
    capabilities: ["skills","instincts","memory-optimization","continuous-learning","security-scanning","research-first-development"],
    directAffinity: true,
    adapterOperations: [],
    runtimeAdapterStatus: "UNREGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "swarmclaw",
    source: "https://github.com/swarmclawai/swarmclaw",
    revision: "ed38ba5329c20e48c03b4a4028f4a76a1a75e2d1",
    owner: "N07",
    targets: ["N07"],
    capabilities: ["multi-agent-swarms","memory","MCP","delegation","scheduling"],
    directAffinity: false,
    adapterOperations: [],
    runtimeAdapterStatus: "UNREGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "mem0",
    source: "https://github.com/mem0ai/mem0",
    revision: "abb81c88e1f738a8117d8293530fbc31a5ef8fd9",
    owner: "N06",
    targets: ["N06","SARA"],
    capabilities: ["persistent-agent-memory","memory-management"],
    directAffinity: true,
    adapterOperations: [],
    runtimeAdapterStatus: "UNREGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "letta",
    source: "https://github.com/letta-ai/letta",
    revision: "5bcdd177d70fa2b31a754cfcd801e77b2e1ab16a",
    owner: "N06",
    targets: ["N06","SARA"],
    capabilities: ["stateful-agents","advanced-memory","learning"],
    directAffinity: true,
    adapterOperations: [],
    runtimeAdapterStatus: "UNREGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "langfuse",
    source: "https://github.com/langfuse/langfuse",
    revision: "f75c661dbe8c6b85523c81486b39e8403ac2c141",
    owner: "N07",
    targets: ["N07","SARA"],
    capabilities: ["tracing","evaluation","datasets","LLM-observability"],
    directAffinity: true,
    adapterOperations: [],
    runtimeAdapterStatus: "UNREGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "vllm",
    source: "https://github.com/vllm-project/vllm",
    revision: "7dfe3338d5f15dd3ccb233326aa65fde46e427ad",
    owner: "N07",
    targets: ["N07"],
    capabilities: ["high-throughput-inference","serving"],
    directAffinity: true,
    adapterOperations: [],
    runtimeAdapterStatus: "UNREGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "sglang",
    source: "https://github.com/sgl-project/sglang",
    revision: "65f759144d192671af5301568113e38686999871",
    owner: "N07",
    targets: ["N07"],
    capabilities: ["high-performance-serving","multimodal-serving"],
    directAffinity: true,
    adapterOperations: [],
    runtimeAdapterStatus: "UNREGISTERED",
    state: 'PROJECTED',
  },
  {
    id: "ray",
    source: "https://github.com/ray-project/ray",
    revision: "f8a314bf077c9772fee2a8a1073368ca2ef9360b",
    owner: "N07",
    targets: ["N07"],
    capabilities: ["distributed-compute","actors","parallelism","AI workloads"],
    directAffinity: true,
    adapterOperations: ["cluster.describe","task.execute","actor.execute"],
    runtimeAdapterStatus: "EXPANSION_ONLY",
    state: 'PROJECTED',
  },
  {
    id: "megatron-lm",
    source: "https://github.com/NVIDIA/Megatron-LM",
    revision: "160561d12927b36b1429ac35f86793cb2ece0ec6",
    owner: "N07",
    targets: ["N07"],
    capabilities: ["large-scale-transformer-training","distributed-training"],
    directAffinity: false,
    adapterOperations: [],
    runtimeAdapterStatus: "UNREGISTERED",
    state: 'PROJECTED',
  }
];

const INDEX = new Map(N01_EXTERNAL_PROVIDERS.map((source) => [source.id, source] as const));

export function resolveN01ExternalProvider(provider: string): N01ExternalProvider {
  const normalized = provider.trim().toLowerCase();
  const source = INDEX.get(normalized);
  if (!source) throw new Error(`N01_EXTERNAL_PROVIDER_UNKNOWN:${provider}`);
  return source;
}

export function findN01ExternalProvidersByCapability(query: string): readonly N01ExternalProvider[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return N01_EXTERNAL_PROVIDERS;
  return N01_EXTERNAL_PROVIDERS.filter((source) =>
    [source.id, source.source, source.owner, source.capabilities.join(' ')]
      .join(' ')
      .toLowerCase()
      .includes(needle),
  );
}

export function canonicalOwnerForExternalProvider(provider: string): string {
  return resolveN01ExternalProvider(provider).owner;
}

export function describeN01ExternalCapabilityFabric() {
  const byState = {
    READY: N01_EXTERNAL_PROVIDERS.filter((source) => source.state === 'READY').length,
    DEGRADED: N01_EXTERNAL_PROVIDERS.filter((source) => source.state === 'DEGRADED').length,
    PROJECTED: N01_EXTERNAL_PROVIDERS.filter((source) => source.state === 'PROJECTED').length,
  };
  const byAdapterStatus = {
    REGISTERED: N01_EXTERNAL_PROVIDERS.filter((source) => source.runtimeAdapterStatus === 'REGISTERED').length,
    EXPANSION_ONLY: N01_EXTERNAL_PROVIDERS.filter((source) => source.runtimeAdapterStatus === 'EXPANSION_ONLY').length,
    UNREGISTERED: N01_EXTERNAL_PROVIDERS.filter((source) => source.runtimeAdapterStatus === 'UNREGISTERED').length,
  };
  return {
    nucleus: 'N01',
    graph: 'SOUL-34-capability-fabric',
    providerCount: N01_EXTERNAL_PROVIDERS.length,
    nativePeerCount: 9,
    directAffinityCount: N01_EXTERNAL_PROVIDERS.filter((source) => source.directAffinity).length,
    runtimeVerifiedProviderCount: byState.READY,
    byState,
    byAdapterStatus,
    providers: N01_EXTERNAL_PROVIDERS,
    structuralState: 'REAL',
    runtimeState: 'PROJECTED_UNTIL_PROVIDER_E2E',
    liveExecutionProven: false,
    policy: 'resolve pinned source -> preserve canonical native owner -> require registered N07 adapter operation and exact source revision -> require provider result state PASS',
  };
}
