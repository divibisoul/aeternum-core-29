package com.divibisoul.soul.core

sealed interface SoulEvent {
    val timestamp: Long

    data class BatteryChanged(val level: Int, val charging: Boolean, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class NetworkChanged(val transport: String, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class ScreenChanged(val on: Boolean, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class AppForeground(val packageName: String, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class ShizukuChanged(val status: String, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class Tick(override val timestamp: Long = System.currentTimeMillis()) : SoulEvent

    data class TelemetryUpdated(val payload: String, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class SaraCycleCompleted(
        val cycleId: String,
        val correlationId: String,
        val traceHash: String?,
        val converged: Boolean?,
        val rollbackPerformed: Boolean?,
        override val timestamp: Long = System.currentTimeMillis()
    ) : SoulEvent
    data class SaraUnavailable(val code: String, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class RootStateChanged(val status: String, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class MissionProgress(val missionId: String, val status: String, val detail: String? = null, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class WatchdogAlert(
        val reason: String,
        val batteryLevel: Int,
        val thermalStatus: Int,
        val lowMemory: Boolean,
        val anrRisk: Boolean,
        override val timestamp: Long = System.currentTimeMillis()
    ) : SoulEvent
}
