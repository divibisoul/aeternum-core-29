package com.divibisoul.soul.core

sealed interface SoulEvent {
    val timestamp: Long

    data class BatteryChanged(val level: Int, val charging: Boolean, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class NetworkChanged(val transport: String, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class ScreenChanged(val on: Boolean, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class AppForeground(val packageName: String, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class ShizukuChanged(val status: String, override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
    data class Tick(override val timestamp: Long = System.currentTimeMillis()) : SoulEvent
}
