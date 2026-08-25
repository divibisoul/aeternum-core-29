package com.divibisoul.soul.core

enum class ActionRisk { OBSERVE, LOW, MEDIUM, HIGH }

data class SoulAction(val id: String, val description: String, val risk: ActionRisk, val reversible: Boolean)

class SoulGuardian {
    /** v0.2 is intentionally observe-only. No privileged action is approved automatically. */
    fun authorize(action: SoulAction): Boolean = action.risk == ActionRisk.OBSERVE
}
