/**
 * Soul Cognitive Signature
 *
 * A cross-cutting invariant for every hybrid execution:
 * 1. Capability provenance is preserved.
 * 2. Results are correlated to their originating task.
 * 3. Parallel work is preferred when dependencies permit it.
 * 4. No component may claim execution without an execution proof.
 *
 * This is deliberately provider- and nucleus-neutral. It is a property of
 * the Soul fabric itself, not of a particular AI model or transport.
 */
export type SoulExecutionProof = 'PLANNED' | 'DISPATCHED' | 'EXECUTED' | 'FAILED';

export interface SoulExecutionEnvelope {
  taskId: string;
  capability: string;
  sourceNucleus: string;
  targetNucleus: string;
  channelId: string;
  transport: string;
  input: unknown;
  issuedAt: number;
}

export interface SoulExecutionReceipt {
  taskId: string;
  capability: string;
  proof: SoulExecutionProof;
  sourceNucleus: string;
  targetNucleus: string;
  channelId: string;
  transport: string;
  output?: unknown;
  error?: string;
  startedAt: number;
  completedAt: number;
}

export function executionWasReal(receipt: SoulExecutionReceipt): boolean {
  return receipt.proof === 'EXECUTED' && receipt.completedAt >= receipt.startedAt;
}

export function createExecutionEnvelope(
  input: Omit<SoulExecutionEnvelope, 'issuedAt'>,
): SoulExecutionEnvelope {
  return { ...input, issuedAt: Date.now() };
}

/**
 * Lightweight scheduling hint: independent tasks should execute concurrently;
 * dependent tasks must remain ordered. This avoids turning the GPU fabric into
 * an accidental serial CPU-style pipeline.
 */
export function scheduleParallel<T>(
  tasks: Array<() => Promise<T>>,
  parallel = true,
): Promise<T[]> {
  return parallel
    ? Promise.all(tasks.map((task) => task()))
    : tasks.reduce(
        (chain, task) => chain.then(async (results) => [...results, await task()]),
        Promise.resolve([] as T[]),
      );
}
