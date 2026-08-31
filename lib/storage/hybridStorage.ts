export type HybridStorageInput = {
  data: string | Uint8Array | ArrayBuffer | Blob;
  filename?: string;
  mimeType?: string;
  nucleusId?: string;
  metadata?: Record<string, unknown>;
};

export type HybridStorageResult = {
  id: string;
  cid: string;
  mimeType: string;
  createdAt: string;
  metadata: Record<string, unknown>;
  gatewayUrl: string;
};

const WEB3_STORAGE_API_URL = process.env.WEB3_STORAGE_API_URL ?? 'https://api.web3.storage';
const IPFS_GATEWAY_URL = process.env.WEB3_STORAGE_GATEWAY_URL ?? 'https://w3s.link/ipfs';
const STORAGE_TABLE = process.env.SUPABASE_STORAGE_TABLE ?? 'soul_storage_records';

function asBlob(data: HybridStorageInput['data'], mimeType: string): Blob {
  if (data instanceof Blob) return data;
  return new Blob([data], { type: mimeType });
}

async function uploadToWeb3Storage(input: HybridStorageInput): Promise<string> {
  const token = process.env.WEB3_STORAGE_TOKEN;
  if (!token) throw new Error('WEB3_STORAGE_TOKEN is not configured');

  const mimeType = input.mimeType ?? 'application/octet-stream';
  const filename = input.filename ?? 'soul-artifact.bin';
  const form = new FormData();
  form.append('file', asBlob(input.data, mimeType), filename);

  const response = await fetch(`${WEB3_STORAGE_API_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!response.ok) throw new Error(`WEB3_STORAGE_UPLOAD_FAILED:${response.status}`);
  const payload = (await response.json()) as { cid?: string };
  if (!payload.cid) throw new Error('WEB3_STORAGE_CID_MISSING');
  return payload.cid;
}

async function recordInSupabase(record: {
  cid: string;
  mimeType: string;
  nucleusId: string;
  metadata: Record<string, unknown>;
  gatewayUrl: string;
}): Promise<{ id: string; createdAt: string }> {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('SUPABASE_STORAGE_CONFIGURATION_MISSING');

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/${STORAGE_TABLE}`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      cid: record.cid,
      mime_type: record.mimeType,
      nucleus_id: record.nucleusId,
      metadata: record.metadata,
      gateway_url: record.gatewayUrl,
    }),
  });

  if (!response.ok) throw new Error(`SUPABASE_STORAGE_RECORD_FAILED:${response.status}`);
  const rows = (await response.json()) as Array<{ id: string; created_at: string }>;
  const row = rows[0];
  if (!row) throw new Error('SUPABASE_STORAGE_RECORD_EMPTY');
  return { id: row.id, createdAt: row.created_at };
}

export async function storeHybrid(input: HybridStorageInput): Promise<HybridStorageResult> {
  const mimeType = input.mimeType ?? 'application/octet-stream';
  const nucleusId = input.nucleusId ?? 'N01';
  const metadata = input.metadata ?? {};
  const cid = await uploadToWeb3Storage(input);
  const gatewayUrl = `${IPFS_GATEWAY_URL.replace(/\/$/, '')}/${cid}`;
  const record = await recordInSupabase({ cid, mimeType, nucleusId, metadata, gatewayUrl });

  return { id: record.id, cid, mimeType, createdAt: record.createdAt, metadata, gatewayUrl };
}
