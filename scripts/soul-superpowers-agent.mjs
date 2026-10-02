const SUPERPOWERS = Object.freeze({
  source: 'https://github.com/obra/superpowers',
  revision: '8ca22dba9a94f28898bbce59f2537ff4d87c747d',
  skills: Object.freeze([
    'brainstorming',
    'writing-plans',
    'subagent-driven-development',
    'test-driven-development',
    'systematic-debugging',
    'verification-before-completion',
  ]),
});

export function createSuperpowersCortexAgent({ superGPU }) {
  if (!superGPU || typeof superGPU.execute !== 'function') {
    throw new Error('SUPERPOWERS_CORTEX_AGENT_SUPERGPU_REQUIRED');
  }

  const targets = Object.freeze(['prefrontal-neocortex', 'orbital-reasoning', 'SuperGPU']);

  function describe() {
    return {
      id: 'superpowers.cortex-orbital-supergpu',
      provider: 'superpowers',
      upstream: SUPERPOWERS,
      targets: [...targets],
      authority: 'N01/N07 existing authorities',
      runtimeActivationRequiresExplicitAdapter: true,
      noFakeRuntimeSuccess: true,
    };
  }

  async function execute(task, correlationId) {
    if (!task || typeof task !== 'object') throw new Error('SUPERPOWERS_CORTEX_TASK_REQUIRED');
    const target = String(task.target || '').trim();
    if (!targets.includes(target)) throw new Error(`SUPERPOWERS_CORTEX_TARGET_NOT_BOUND:${target}`);
    return superGPU.execute(task, correlationId);
  }

  return { describe, execute };
}
