import assert from "node:assert/strict";
import test from "node:test";
import {
  AETERNUM_ARTIFACT_AFFINITY,
  AETERNUM_ARTIFACT_PARTICIPANTS,
  validateArtifactBalance,
} from "./AeternumArtifactAffinity";

test("L1-L6 artifact affinity stays balanced within one entry per participant", () => {
  assert.equal(AETERNUM_ARTIFACT_AFFINITY.length, 58);

  const validation = validateArtifactBalance();
  assert.equal(validation.ok, true);
  const counts = AETERNUM_ARTIFACT_PARTICIPANTS.map(participant => validation.counts[participant]);
  assert.ok(Math.min(...counts) >= 7);
  assert.ok(Math.max(...counts) <= 8);
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);

  const ids = AETERNUM_ARTIFACT_AFFINITY.map((artifact) => artifact.id);
  assert.equal(new Set(ids).size, ids.length);
});
