export type ExecutionContext = {
  requestId: string;
  correlationId: string;
  source: string;
  target: string;
};

export type ExecutionResult<T = unknown> = {
  status: 'completed' | 'accepted' | 'failed';
  result?: T;
  jobId?: string;
  error?: { code: string; message: string };
};

export interface CapabilityExecutor {
  execute(capability: string, payload: unknown, context: ExecutionContext): Promise<ExecutionResult>;
}
