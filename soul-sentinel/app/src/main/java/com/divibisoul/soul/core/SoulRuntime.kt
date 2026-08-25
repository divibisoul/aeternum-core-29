package com.divibisoul.soul.core

import android.content.Context
import android.os.BatteryManager
import android.os.SystemClock
import kotlinx.coroutines.*

/** Closed-loop runtime: Sense -> Context -> Intent -> Arbiter -> Guardian -> Memory. */
class SoulRuntime(private val context: Context, private val bus: SoulEventBus) {
    private val memory = SoulMemory(context)
    private val intentEngine = SoulIntentEngine()
    private val arbiter = SoulArbiter()
    private val guardian = SoulGuardian()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var job: Job? = null

    fun start() {
        if (job != null) return
        job = scope.launch {
            while (isActive) {
                val state = readContext()
                val hypothesis = intentEngine.infer(state)
                val activeIntent = arbiter.reconcile(hypothesis)
                val action = SoulAction("observe-context", "record current context", ActionRisk.OBSERVE, true)
                if (guardian.authorize(action)) {
                    memory.remember("context", "battery=${state.batteryPercent};charging=${state.charging};intent=$activeIntent", hypothesis.confidence)
                }
                bus.publish(SoulEvent.Tick())
                delay(2000)
            }
        }
    }

    fun stop() { job?.cancel(); job = null }
    fun recentMemory(limit: Int = 20) = memory.recent(limit)

    private fun readContext(): SoulContext {
        val bm = context.getSystemService(BatteryManager::class.java)
        val battery = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY).coerceIn(0, 100)
        return SoulContext(System.currentTimeMillis(), battery, bm.isCharging, "observed", true, SystemClock.elapsedRealtime())
    }
}
