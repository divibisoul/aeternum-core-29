export type N01ExternalProviderState = 'PROJECTED' | 'DEGRADED' | 'READY';

export type N01ExternalProvider = {
  id: string;
  source: string;
  revision: string;
  owner: string;
  targets: readonly string[];
  capabilities: readonly string[];
  directAffinity: boolean;
  state: N01ExternalProviderState;
};

/**
 * Generated from integrations/soul-25-augmentation.json at the N01 boundary.
 * Upstream ownership stays with the canonical native nucleus; the N01 fabric is
 * a resolver, not an alternate executor or source of truth for provider success.
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
    state: 'PROJECTED',
  },
  {
    id: "langgraph",
    source: "https://github.com/langchain-ai/langgraph",
    revision: "157a06dda988d85afeb8751ff27b35ab3f4f8bf4",
    owner: "N07",
    targets: ["N07","N01"],
    capabilities: ["stateful-agents","durable-workflows","orchestration"],
    directAffinity: true,
    state: 'PROJECTED',
  },
  {
    id: "crewai",
    source: "https://github.com/crewAIInc/crewAI",
    revision: "8078f9130c35a47be95d4a55bf1d73b3fd44fc88",
    owner: "N07",
    targets: ["N07"],
    capabilities: ["multi-agent-crews","flows","role-specialization"],
    directAffinity: false,
    state: 'PROJECTED',
  },
  {
    id: "microsoft-agent-framework",
    source: "https://github.com/microsoft/agent-framework",
    revision: "a2f4506c0ba30cea7c9bbe907fc158c0db2cc6a3",
    owner: "N07",
    targets: ["N07"],
    capabilities: ["agents","workflows","MCP","A2A"],
    directAffinity: false,
    state: 'PROJECTED',
  },
  {
    id: "openhands",
    source: "https://github.com/OpenHands/OpenHands",
    revision: "2414d6ee5e31bede2e78211f72b58e9949575a75",
    owner: "N06",
    targets: ["N06"],
    capabilities: ["software-agents","tool-use","execution"],
    directAffinity: false,
    state: 'PROJECTED',
  },
  {
    id: "metagpt",
    source: "https://github.com/FoundationAgents/MetaGPT",
    revision: "11cdf466d042aece04fc6cfd13b28e1a70341b1f",
    owner: "N06",
    targets: ["N06"],
    capabilities: ["role-based-agents","multi-agent-collaboration","software-process"],
    directAffinity: false,
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
    state: 'PROJECTED',
  },
  {
    id: "letta-code",
    source: "https://github.com/letta-ai/letta-code",
    revision: "1fcc9666817ab852bc2532a3a989f712e1fd6c19",
    owner: "N01",
    targets: ["N01"],
    capabilities: ["stateful-agents","persistent-memory","identity"],
    directAffinity: true,
    state: 'PROJECTED',
  },
  {
    id: "browser-use",
    source: "https://github.com/browser-use/browser-use",
    revision: "302d8fcb245a7a63fb7531a4734c9ce3c7792779",
    owner: "N04",
    targets: ["N04"],
    capabilities: ["browser-agents","web-automation"],
    directAffinity: false,
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
    state: 'PROJECTED',
  },
  {
    id: "pydantic-ai",
    source: "https://github.com/pydantic/pydantic-ai",
    revision: "6bc07cf18b0641ea92343d8c589cfb922108b802",
    owner: "N01",
    targets: ["N01","JEV"],
    capabilities: ["typed-agents","tools","subagents","durable-execution"],
    directAffinity: true,
    state: 'PROJECTED',
  },
  {
    id: "llama-index",
    source: "https://github.com/run-llama/llama_index",
    revision: "962940ddc079cc21701d28d1237c84c82a7c5164",
    owner: "N05",
    targets: ["N05"],
    capabilities: ["RAG","indexing","retrieval","agent-workflows"],
    directAffinity: false,
    state: 'PROJECTED',
  },
  {
    id: "dspy",
    source: "https://github.com/stanfordnlp/dspy",
    revision: "ba3f9198efe5d125c7c1a2b40b1f1e6166209bd2",
    owner: "N06",
    targets: ["N06"],
    capabilities: ["LM-programming","optimization","reasoning-pipelines"],
    directAffinity: false,
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
  return {
    nucleus: 'N01',
    graph: 'SOUL-34-capability-fabric',
    providerCount: N01_EXTERNAL_PROVIDERS.length,
    nativePeerCount: 9,
    directAffinityCount: N01_EXTERNAL_PROVIDERS.filter((source) => source.directAffinity).length,
    runtimeVerifiedProviderCount: byState.READY,
    byState,
    providers: N01_EXTERNAL_PROVIDERS,
    structuralState: 'REAL',
    runtimeState: 'PROJECTED_UNTIL_PROVIDER_E2E',
    liveExecutionProven: false,
    policy: 'resolve -> canonical native owner -> explicitly registered external adapter; adapter disabled, source unpinned or E2E unproven => BLOCKED',
  };
}
