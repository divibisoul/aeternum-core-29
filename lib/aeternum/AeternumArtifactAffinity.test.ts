import assert from "node:assert/strict";
import test from "node:test";
import {
  AETERNUM_ARTIFACT_AFFINITY,
  AETERNUM_ARTIFACT_PARTICIPANTS,
  validateArtifactBalance,
} from "./AeternumArtifactAffinity";

test("L1-L5 functional artifact affinity is balanced 6x8", () => {
  assert.equal(AETERNUM_ARTIFACT_AFFINITY.length, 48);

  const validation = validateArtifactBalance();
  assert.equal(validation.ok, true);
  for (const participant of AETERNUM_ARTIFACT_PARTICIPANTS) {
    assert.equal(validation.counts[participant], 6);
  }

  const ids = AETERNUM_ARTIFACT_AFFINITY.map((artifact) => artifact.id);
  assert.equal(new Set(ids).size, ids.length);
});
