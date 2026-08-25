package com.divibisoul.soul.core

import android.os.BatteryManager
import android.os.SystemClock

data class SoulContext(
    val timestamp: Long,
    val batteryPercent: Int,
    val charging: Boolean,
    val network: String,
    val screenOn: Boolean,
    val uptimeMs: Long
)

enum class IntentType { IDLE, FOCUS, COMMUNICATION, MEDIA, PERFORMANCE }

data class IntentHypothesis(val type: IntentType, val confidence: Float)

/** Deterministic context-to-intent baseline. AI/embeddings can replace this later. */
class SoulIntentEngine {
    fun infer(context: SoulContext): IntentHypothesis {
        if (context.batteryPercent <= 15 && !context.charging) return IntentHypothesis(IntentType.IDLE, .70f)
        return IntentHypothesis(IntentType.IDLE, .50f)
    }
}

class SoulArbiter(private val consecutiveRequired: Int = 3) {
    private var candidate: IntentType? = null
    private var count = 0
    private var active = IntentType.IDLE

    fun reconcile(hypothesis: IntentHypothesis): IntentType {
        if (hypothesis.confidence < .65f || hypothesis.type == active) {
            candidate = null; count = 0
            return active
        }
        if (candidate == hypothesis.type) count++ else { candidate = hypothesis.type; count = 1 }
        if (count >= consecutiveRequired) { active = hypothesis.type; candidate = null; count = 0 }
        return active
    }
}
