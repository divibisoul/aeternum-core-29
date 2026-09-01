export type NeuralOperation = "neural.forward@1.0.0" | "neural.learn@1.0.0";
export type NeuralRequest = { operation: NeuralOperation; payload: number[]; correlationId?: string; deadlineMs?: number };
export type NeuralResponse = { traceId: string; correlationId: string; payload?: number[]; data?: unknown; status?: string; error?: string };

const CONTRACT = "1.1.0";
const MESH_VERSION = "1.0";

function randomId(prefix: string): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `${prefix}-${Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("")}`;
}

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map(k => `${JSON.stringify(k)}:${stable(object[k])}`).join(",")}}`;
}

async function sign(body: Record<string, unknown>, secret: string): Promise<string> {
  if (secret.length < 16) throw new Error("SOUL_MESH_HMAC_SECRET must contain at least 16 characters");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const unsigned = { ...body };
  delete unsigned.hmac;
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(stable(unsigned)));
  return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, "0")).join("");
}

export class N07NeuralBridge {
  private readonly baseUrl: string;
  private readonly secret: string;
  private readonly source: string;
  private readonly timeoutMs: number;

  constructor(source: "N01", options: { baseUrl?: string; secret?: string; timeoutMs?: number } = {}) {
    this.baseUrl = (options.baseUrl ?? process.env.SOUL_N07_URL ?? "").replace(/\/$/, "");
    this.secret = options.secret ?? process.env.SOUL_MESH_HMAC_SECRET ?? "";
    this.source = source;
    this.timeoutMs = options.timeoutMs ?? 15000;
    if (!this.baseUrl) throw new Error("SOUL_N07_URL is required");
  }

  async invoke(request: NeuralRequest): Promise<NeuralResponse> {
    if (!Number.isInteger(request.payload.length) || request.payload.some(v => !Number.isFinite(v))) throw new Error("neural payload must contain finite numbers");
    const correlationId = request.correlationId?.trim() || randomId("corr");
    const timestamp = Date.now();
    const envelope: Record<string, unknown> = {
      version: MESH_VERSION, contractVersion: CONTRACT, messageId: randomId("msg"), source: this.source, target: "N07",
      timestamp, nonce: randomId("nonce"), correlationId, type: "CAPABILITY_REQUEST",
      payload: { capability: request.operation.split("@")[0], payload: { data: request.payload } },
    };
    envelope.hmac = await sign(envelope, this.secret);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.max(1, request.deadlineMs ?? this.timeoutMs));
    try {
      const response = await fetch(`${this.baseUrl}/api/soul-mesh`, { method: "POST", headers: { "content-type": "application/json", "x-soul-contract-version": CONTRACT, "x-soul-correlation-id": correlationId }, body: JSON.stringify(envelope), signal: controller.signal });
      const result = await response.json() as Record<string, unknown>;
      if (!response.ok) throw new Error(String(result.error ?? `N07 Mesh request failed: ${response.status}`));
      if (String(result.contractVersion) !== CONTRACT) throw new Error("N07 Mesh response contract mismatch");
      if (String(result.correlationId) !== correlationId) throw new Error("N07 Mesh correlation mismatch");
      return { traceId: String(result.id ?? result.messageId ?? envelope.messageId), correlationId, payload: Array.isArray(result.payload) ? result.payload.map(Number) : undefined, data: result.payload, status: String(result.status ?? "ok") };
    } finally { clearTimeout(timeout); }
  }

  forward(payload: number[], correlationId?: string): Promise<NeuralResponse> {
    return this.invoke({ operation: "neural.forward@1.0.0", payload, correlationId });
  }

  learn(input: number[], target: number[], correlationId?: string): Promise<NeuralResponse> {
    if (input.length === 0 || input.length !== target.length) throw new Error("input and target dimensions must match");
    return this.invoke({ operation: "neural.learn@1.0.0", payload: [...input, ...target], correlationId });
  }
}
