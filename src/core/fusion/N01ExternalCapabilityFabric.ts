export type N01ExternalProviderState = 'PROJECTED' | 'DEGRADED';
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

// Canonical 25-source snapshot copied from N07's integration authority.
// The snapshot is executable routing metadata; source code remains preserved
// in its own repository/submodule and ownership remains native-per-capability.
export const N01_EXTERNAL_PROVIDERS: readonly N01ExternalProvider[] = [
  ['superpowers','https://github.com/obra/superpowers','8ca22dba9a94f28898bbce59f2537ff4d87c747d','N07',['N07'],['agentic-skills','subagents','planning','tdd','review','debugging'],false],
  ['superagi','https://github.com/TransformerOptimus/SuperAGI','c3c1982e7bd6a11cfed53c5a193ea502f924b1b6','N07',['N07'],['autonomous-agents','tools','memory','multimodal','telemetry'],false],
  ['langgraph','https://github.com/langchain-ai/langgraph','157a06dda988d85afeb8751ff27b35ab3f4f8bf4','N07',['N07','N01'],['stateful-agents','durable-workflows','orchestration'],true],
  ['crewai','https://github.com/crewAIInc/crewAI','8078f9130c35a47be95d4a55bf1d73b3fd44fc88','N07',['N07'],['multi-agent-crews','flows','role-specialization'],false],
  ['microsoft-agent-framework','https://github.com/microsoft/agent-framework','a2f4506c0ba30cea7c9bbe907fc158c0db2cc6a3','N07',['N07'],['agents','workflows','MCP','A2A'],false],
  ['openhands','https://github.com/OpenHands/OpenHands','2414d6ee5e31bede2e78211f72b58e9949575a75','N06',['N06'],['software-agents','tool-use','execution'],false],
  ['metagpt','https://github.com/FoundationAgents/MetaGPT','11cdf466d042aece04fc6cfd13b28e1a70341b1f','N06',['N06'],['role-based-agents','multi-agent-collaboration','software-process'],false],
  ['agentscope','https://github.com/agentscope-ai/agentscope','72f3f6fa0b2fc38b8517f408ab616f0f2bd229e6','N03',['N03','N07'],['agents','teams','tools','memory','sandbox','A2A','voice'],false],
  ['letta-code','https://github.com/letta-ai/letta-code','1fcc9666817ab852bc2532a3a989f712e1fd6c19','N01',['N01'],['stateful-agents','persistent-memory','identity'],true],
  ['browser-use','https://github.com/browser-use/browser-use','302d8fcb245a7a63fb7531a4734c9ce3c7792779','N04',['N04'],['browser-agents','web-automation'],false],
  ['smolagents','https://github.com/huggingface/smolagents','c30b115286e000e98711fae5e85993547b73d826','N06',['N06'],['code-agents','tools','MCP','multimodal'],false],
  ['pydantic-ai','https://github.com/pydantic/pydantic-ai','6bc07cf18b0641ea92343d8c589cfb922108b802','N01',['N01','JEV'],['typed-agents','tools','subagents','durable-execution'],true],
  ['llama-index','https://github.com/run-llama/llama_index','962940ddc079cc21701d28d1237c84c82a7c5164','N05',['N05'],['RAG','indexing','retrieval','agent-workflows'],false],
  ['dspy','https://github.com/stanfordnlp/dspy','ba3f9198efe5d125c7c1a2b40b1f1e6166209bd2','N06',['N06'],['LM-programming','optimization','reasoning-pipelines'],false],
  ['whisper','https://github.com/openai/whisper','86098128c0b4f24f0e2aa2994de830614b474227','N03',['N03'],['speech-to-text'],false],
  ['kokoro','https://github.com/hexgrad/kokoro','dfb907a02bba8152ca444717ca5d78747ccb4bec','N03',['N03'],['text-to-speech'],false],
  ['everything-claude-code','https://github.com/affaan-m/ECC','ef648e01899ba3e8dc6371642deaaf64b4477775','N07',['N07'],['skills','instincts','memory-optimization','continuous-learning','security-scanning','research-first-development'],true],
  ['swarmclaw','https://github.com/swarmclawai/swarmclaw','ed38ba5329c20e48c03b4a4028f4a76a1a75e2d1','N07',['N07'],['multi-agent-swarms','memory','MCP','delegation','scheduling'],false],
  ['mem0','https://github.com/mem0ai/mem0','abb81c88e1f738a8117d8293530fbc31a5ef8fd9','N06',['N06','SARA'],['persistent-agent-memory','memory-management'],true],
  ['letta','https://github.com/letta-ai/letta','5bcdd177d70fa2b31a754cfcd801e77b2e1ab16a','N06',['N06','SARA'],['stateful-agents','advanced-memory','learning'],true],
  ['langfuse','https://github.com/langfuse/langfuse','f75c661dbe8c6b85523c81486b39e8403ac2c141','N07',['N07','SARA'],['tracing','evaluation','datasets','LLM-observability'],true],
  ['vllm','https://github.com/vllm-project/vllm','7dfe3338d5f15dd3ccb233326aa65fde46e427ad','N07',['N07'],['high-throughput-inference','serving'],true],
  ['sglang','https://github.com/sgl-project/sglang','65f759144d192671af5301568113e38686999871','N07',['N07'],['high-performance-serving','multimodal-serving'],true],
  ['ray','https://github.com/ray-project/ray','f8a314bf077c9772fee2a8a1073368ca2ef9360b','N07',['N07'],['distributed-compute','actors','parallelism','AI workloads'],true],
  ['megatron-lm','https://github.com/NVIDIA/Megatron-LM','160561d12927b36b1429ac35f86793cb2ece0ec6','N07',['N07'],['large-scale-transformer-training','distributed-training'],false],
].map(([id,source,revision,owner,targets,capabilities,directAffinity])=>({
  id: id as string, source: source as string, revision: revision as string, owner: owner as string,
  targets: targets as readonly string[], capabilities: capabilities as readonly string[],
  directAffinity: Boolean(directAffinity), state: id === 'letta-code' ? 'DEGRADED' : 'PROJECTED',
} as N01ExternalProvider));

const INDEX = new Map(N01_EXTERNAL_PROVIDERS.map(source => [source.id, source] as const));

export function resolveN01ExternalProvider(provider: string): N01ExternalProvider {
  const normalized = provider.trim().toLowerCase();
  const source = INDEX.get(normalized);
  if (!source) throw new Error(`N01_EXTERNAL_PROVIDER_UNKNOWN:${provider}`);
  return source;
}

export function findN01ExternalProvidersByCapability(query: string): readonly N01ExternalProvider[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return N01_EXTERNAL_PROVIDERS;
  return N01_EXTERNAL_PROVIDERS.filter(source =>
    [source.id, source.source, source.capabilities.join(' ')].join(' ').toLowerCase().includes(needle),
  );
}

export function describeN01ExternalCapabilityFabric() {
  return {
    nucleus: 'N01',
    providerCount: N01_EXTERNAL_PROVIDERS.length,
    directAffinityCount: N01_EXTERNAL_PROVIDERS.filter(item => item.directAffinity).length,
    providers: N01_EXTERNAL_PROVIDERS,
    policy: 'resolve -> canonical native owner -> executable native operation; missing adapter/configuration remains BLOCKED',
  };
}

export function canonicalOwnerForExternalProvider(provider: string): string {
  return resolveN01ExternalProvider(provider).owner;
}