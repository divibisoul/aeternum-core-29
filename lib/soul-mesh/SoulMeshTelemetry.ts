export type SoulMeshTelemetryEvent =
  | "mesh.request.started"
  | "mesh.request.sent"
  | "mesh.request.received"
  | "mesh.capability.started"
  | "mesh.capability.completed"
  | "mesh.capability.failed"
  | "mesh.request.completed"
  | "mesh.request.failed"
  | "mesh.job.queued"
  | "mesh.job.completed"
  | "mesh.job.failed";

export interface SoulMeshTelemetryRecord {
  timestamp: string;
  event: SoulMeshTelemetryEvent;
  nucleus: string;
  source?: string;
  target?: string;
  requestId?: string;
  correlationId?: string;
  jobId?: string;
  capability?: string;
  transport?: string;
  status?: string;
  durationMs?: number;
  attempt?: number;
  errorCode?: string;
}

/**
 * Serverless-safe Mesh telemetry. It emits one structured JSON record per event
 * and deliberately excludes request payloads/secrets. Consumers can forward
 * stdout to their platform's log/telemetry backend without introducing a
 * second Mesh transport.
 */
export class SoulMeshTelemetry {
  private readonly nucleus: string;

  constructor(nucleus: string) {
    this.nucleus = nucleus;
  }

  emit(
    event: SoulMeshTelemetryEvent,
    fields: Omit<SoulMeshTelemetryRecord, "timestamp" | "event" | "nucleus"> = {},
  ): SoulMeshTelemetryRecord {
    const record: SoulMeshTelemetryRecord = {
      timestamp: new Date().toISOString(),
      event,
      nucleus: this.nucleus,
      ...fields,
    };

    // Structured stdout is compatible with serverless runtimes and preserves
    // the existing logging path instead of replacing it.
    console.log(JSON.stringify({ soulMesh: record }));
    return record;
  }
}
