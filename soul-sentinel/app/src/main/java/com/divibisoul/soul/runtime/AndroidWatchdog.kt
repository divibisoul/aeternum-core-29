package com.divibisoul.soul.runtime

import android.app.ActivityManager
import android.content.ComponentCallbacks2
import android.content.Context
import android.os.BatteryManager
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import com.divibisoul.soul.core.SoulEvent
import com.divibisoul.soul.core.SoulEventBus
import com.divibisoul.soul.core.state.DashboardStateStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class AndroidWatchdog(
    context: Context,
    private val bus: SoulEventBus,
    private val missionControl: MissionControl,
    private val dashboard: DashboardStateStore,
    private val scope: CoroutineScope
) : ComponentCallbacks2 {

    private val appContext = context.applicationContext
    private var consecutiveSaraFailures = 0
    private val loadReduced = AtomicBoolean(false)

    fun check(saraHealthy: Boolean = true) {
        val bm = appContext.getSystemService(BatteryManager::class.java)
        val level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        val pm = appContext.getSystemService(PowerManager::class.java)
        val thermal = if (android.os.Build.VERSION.SDK_INT >= 29) pm.currentThermalStatus else PowerManager.THERMAL_STATUS_NONE
        val memory = appContext.getSystemService(ActivityManager::class.java).let {
            ActivityManager.MemoryInfo().also(it::getMemoryInfo)
        }
        val anrRisk = mainThreadUnresponsive()

        if (level in 0..10 || thermal >= PowerManager.THERMAL_STATUS_SEVERE || memory.lowMemory || anrRisk) {
            protect(
                reason = "WATCHDOG_PROTECTIVE_PAUSE",
                batteryLevel = level,
                thermalStatus = thermal,
                lowMemory = memory.lowMemory,
                anrRisk = anrRisk
            )
        }

        if (saraHealthy) consecutiveSaraFailures = 0 else consecutiveSaraFailures++
        if (consecutiveSaraFailures >= 3) {
            protect(
                reason = "SARA_CONSECUTIVE_FAILURES",
                batteryLevel = level,
                thermalStatus = thermal,
                lowMemory = memory.lowMemory,
                anrRisk = anrRisk
            )
        }
    }

    fun isLoadReduced(): Boolean = loadReduced.get()

    fun clearProtection() {
        loadReduced.set(false)
    }

    private fun protect(
        reason: String,
        batteryLevel: Int,
        thermalStatus: Int,
        lowMemory: Boolean,
        anrRisk: Boolean
    ) {
        val firstProtection = loadReduced.compareAndSet(false, true)
        if (firstProtection) {
            scope.launch {
                runCatching { dashboard.captureSafetySnapshot(reason) }
                missionControl.pause(reason)
            }
        } else {
            missionControl.pause(reason)
        }
        bus.publish(
            SoulEvent.WatchdogAlert(
                reason = reason,
                batteryLevel = batteryLevel,
                thermalStatus = thermalStatus,
                lowMemory = lowMemory,
                anrRisk = anrRisk
            )
        )
    }

    private fun mainThreadUnresponsive(): Boolean {
        if (Looper.myLooper() == Looper.getMainLooper()) return false
        val latch = CountDownLatch(1)
        Handler(Looper.getMainLooper()).post { latch.countDown() }
        return try {
            !latch.await(2, TimeUnit.SECONDS)
        } catch (_: InterruptedException) {
            Thread.currentThread().interrupt()
            false
        }
    }

    override fun onTrimMemory(level: Int) {
        val critical = level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL
        if (critical) {
            protect(
                reason = "TRIM_MEMORY_RUNNING_CRITICAL",
                batteryLevel = -1,
                thermalStatus = -1,
                lowMemory = true,
                anrRisk = false
            )
        }
    }

    override fun onConfigurationChanged(newConfig: android.content.res.Configuration) = Unit

    override fun onLowMemory() {
        protect(
            reason = "LOW_MEMORY",
            batteryLevel = -1,
            thermalStatus = -1,
            lowMemory = true,
            anrRisk = false
        )
    }
}
