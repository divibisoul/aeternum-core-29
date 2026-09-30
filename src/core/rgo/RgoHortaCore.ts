import { hortaCore } from '../hortaCore';

export interface RgoStagePayload {
  stage: string;
  scale: string;
  finding_id: string;
  cycle_id: string;
  parent_stage: string | null;
  parent_hash: string;
  input_hash: string;
  output_hash: string;
  status: string;
  data: Record<string, unknown>;
}

export function storeRgoStageInHortaCore(stage: RgoStagePayload): { key: string; output_hash: string } {
  if (!stage || !stage.finding_id || !stage.cycle_id || !stage.stage || !stage.output_hash) throw new Error('RGO_HORTA_STAGE_REQUIRED');
  const key = ['rgo', 'trinity', stage.finding_id, stage.cycle_id, stage.stage, stage.output_hash].join('.');
  hortaCore.set(key, { ...stage });
  return { key, output_hash: stage.output_hash };
}
