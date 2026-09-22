/**
 * Processor contract shared by every fusion processor.
 *
 * A processor is a distinct component with its own identity, purpose,
 * authority, inputs, outputs, state, memory, metrics and specialization.
 * The shared runtime only provides INFRASTRUCTURE; it never merges
 * processor identities.
 */
import type { FusionEnvelope } from './FusionEnvelope';

export type ProcessorHealthState =
  | 'INITIALIZING'
  | 'ACTIVE'
  | 'DEGRADED'
  | 'UNHEALTHY'
  | 'OFFLINE'
  | 'RECOVERING'
  | 'FAILED';

/** Honest commissioning status. BLOCKED/SPECIFICATION_MISSING must never report ACTIVE. */
export type ProcessorCommissioning = 'OPERATIONAL' | 'SPECIFICATION_MISSING' | 'BLOCKED';

/** What a processor is allowed to decide. No processor here executes side effects on the host. */
export type ProcessorAuthority =
  | 'CONTEXT_PROVIDER'
  | 'PLANNING'
  | 'OBSERVATION'
  | 'VALIDATION_VETO'
  | 'EXPLANATION'
  | 'UNSPECIFIED';

export interface ProcessorDescriptor {
  id: string;
  name: string;
  /** Documentation-only analogy. Never implemented literally. */
  analogy: string;
  purpose: string;
  authority: ProcessorAuthority;
  capabilities: readonly string[];
  commissioning: ProcessorCommissioning;
  /** Every fusion processor lives inside nucleus N01. */
  nucleus: 'N01';
  /** Capabilities safe to retry because they cause no state transition. */
  idempotentCapabilities?: readonly string[];
}

/** A metric whose real value cannot be measured is reported as 'unavailable', never 0. */
export type MetricValue = number | 'unavailable';

export interface Processor {
  readonly descriptor: ProcessorDescriptor;
  initialize?(): Promise<void> | void;
  /** Executes one request envelope and returns the processor output. */
  handle(envelope: FusionEnvelope): Promise<unknown> | unknown;
  shutdown?(): Promise<void> | void;
  /** Processor-specific metrics; runtime metrics are tracked separately. */
  metrics?(): Record<string, MetricValue>;
}

export const PROCESSOR_ERROR = {
  ALREADY_STARTED: 'PROCESSOR_ALREADY_STARTED',
  NOT_STARTED: 'PROCESSOR_NOT_STARTED',
  TIMEOUT: 'PROCESSOR_TIMEOUT',
  EXPIRED: 'PROCESSOR_DEADLINE_EXPIRED',
  BACKPRESSURE: 'PROCESSOR_BACKPRESSURE',
  CAPABILITY_REJECTED: 'PROCESSOR_CAPABILITY_REJECTED',
  BLOCKED: 'PROCESSOR_BLOCKED',
} as const;
