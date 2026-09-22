package com.divibisoul.soul.core.state

import android.content.Context
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

private val Context.dashboardDataStore by preferencesDataStore("soul_dashboard")

data class DashboardState(
    val hardware: String = "UNAVAILABLE",
    val batteryThermal: String = "UNAVAILABLE",
    val saraHealth: String = "UNCONFIGURED",
    val n07Health: String = "DISABLED",
    val lastCycleId: String? = null,
    val lastTraceHash: String? = null,
    val rootStatus: String = "UNKNOWN",
    val queueDepth: Int = 0,
    val errors: List<String> = emptyList()
)

class DashboardStateStore(private val context: Context) {
    private val mutex = Mutex()
    private val _state = MutableStateFlow(DashboardState())
    val state: StateFlow<DashboardState> = _state.asStateFlow()

    suspend fun load() = mutex.withLock {
        val p = context.dashboardDataStore.data.first()
        _state.value = fromPrefs(p)
    }

    suspend fun set(state: DashboardState) = mutex.withLock {
        _state.value = state
        context.dashboardDataStore.edit { p -> writePrefs(p, state) }
    }

    suspend fun patch(transform: (DashboardState) -> DashboardState) = mutex.withLock {
        val next = transform(_state.value)
        _state.value = next
        context.dashboardDataStore.edit { p -> writePrefs(p, next) }
    }

    private fun fromPrefs(p: Preferences) = DashboardState(
        hardware = p[HARDWARE] ?: "UNAVAILABLE",
        batteryThermal = p[BATTERY_THERMAL] ?: "UNAVAILABLE",
        saraHealth = p[SARA_HEALTH] ?: "UNCONFIGURED",
        n07Health = p[N07_HEALTH] ?: "DISABLED",
        lastCycleId = p[LAST_CYCLE],
        lastTraceHash = p[LAST_TRACE],
        rootStatus = p[ROOT_STATUS] ?: "UNKNOWN",
        queueDepth = p[QUEUE_DEPTH]?.toIntOrNull() ?: 0,
        errors = p[ERRORS]?.split("\n").orEmpty().filter(String::isNotBlank)
    )

    private fun writePrefs(p: MutablePreferences, s: DashboardState) {
        p[HARDWARE] = s.hardware
        p[BATTERY_THERMAL] = s.batteryThermal
        p[SARA_HEALTH] = s.saraHealth
        p[N07_HEALTH] = s.n07Health
        if (s.lastCycleId == null) p.remove(LAST_CYCLE) else p[LAST_CYCLE] = s.lastCycleId
        if (s.lastTraceHash == null) p.remove(LAST_TRACE) else p[LAST_TRACE] = s.lastTraceHash
        p[ROOT_STATUS] = s.rootStatus
        p[QUEUE_DEPTH] = s.queueDepth.toString()
        p[ERRORS] = s.errors.takeLast(50).joinToString("\n")
    }

    companion object {
        private val HARDWARE = stringPreferencesKey("hardware")
        private val BATTERY_THERMAL = stringPreferencesKey("battery_thermal")
        private val SARA_HEALTH = stringPreferencesKey("sara_health")
        private val N07_HEALTH = stringPreferencesKey("n07_health")
        private val LAST_CYCLE = stringPreferencesKey("last_cycle")
        private val LAST_TRACE = stringPreferencesKey("last_trace")
        private val ROOT_STATUS = stringPreferencesKey("root_status")
        private val QUEUE_DEPTH = stringPreferencesKey("queue_depth")
        private val ERRORS = stringPreferencesKey("errors")
    }
}
