package com.divibisoul.soul.runtime

import android.content.Context
import com.divibisoul.soul.core.SoulEvent
import com.divibisoul.soul.core.SoulEventBus
import com.divibisoul.soul.core.hardware.AndroidHardwareAbstraction
import com.divibisoul.soul.core.security.RootGate
import com.divibisoul.soul.core.state.DashboardStateStore
import com.divibisoul.soul.data.FeedbackRepository
import com.divibisoul.soul.data.LogSyncWorker
import com.divibisoul.soul.network.N07Client
import com.divibisoul.soul.network.SaraClient
import com.divibisoul.soul.network.SecureEndpointConfigStore
import androidx.work.*
import kotlinx.coroutines.*
import java.util.concurrent.TimeUnit

class SoulAdminPlusRuntime(
    context: Context,
    private val bus: SoulEventBus,
    private val scope: CoroutineScope
) {
    private val appContext = context.applicationContext
    private val config = SecureEndpointConfigStore(appContext)
    private val hardware = AndroidHardwareAbstraction(appContext)
    private val dashboard = DashboardStateStore(appContext)
    private val sara = SaraClient(config)
    private val n07 = N07Client(config)
    private val root = RootGate()
    private val missions = MissionControl(appContext)
    private val watchdog = AndroidWatchdog(appContext, bus, missions)
    private val feedback = FeedbackRepository(appContext)
    private var job: Job? = null

    fun start() {
        if (job != null) return
        missions.resume()
        job = scope.launch(Dispatchers.Default) {
            dashboard.load()
            val snapshot = hardware.detect()
            dashboard.patch {
                it.copy(
                    hardware = snapshot.manufacturer + " " + snapshot.model + " | API " + snapshot.apiLevel +
                        " | CPU cores " + snapshot.cpuCores + " | NPU " + snapshot.hasNpu,
                    batteryThermal = "battery=" + (snapshot.batteryLevel?.toString() ?: "unavailable") +
                        "% temp=" + (snapshot.batteryTempC?.toString() ?: "unavailable") + "C"
                )
            }

            val rootStatus = root.status()
            dashboard.patch {
                it.copy(
                    rootStatus = if (rootStatus.available) "AVAILABLE" else "UNAVAILABLE"
                )
            }
            bus.publish(SoulEvent.RootStateChanged(dashboard.state.value.rootStatus))

            while (isActive) {
                refreshBackends()
                refreshHardware()
                scheduleLogSync()
                delay(15_000L)
            }
        }
    }

    private suspend fun refreshBackends() {
        try {
            val health = sara.health()
            dashboard.patch { it.copy(saraHealth = health.optString("status", "UNKNOWN")) }
        } catch (e: Exception) {
            val code = (e as? com.divibisoul.soul.network.SaraException)?.code ?: "SARA_UNAVAILABLE"
            dashboard.patch { it.copy(saraHealth = code) }
            bus.publish(SoulEvent.SaraUnavailable(code))
        }

        val cfg = config.read()
        if (cfg.n07Enabled) {
            try {
                val health = n07.health()
                dashboard.patch { it.copy(n07Health = health.optString("status", "UNKNOWN")) }
            } catch (e: Exception) {
                dashboard.patch {
                    it.copy(n07Health = (e as? com.divibisoul.soul.network.N07Exception)?.code ?: "N07_UNAVAILABLE")
                }
            }
        } else {
            dashboard.patch { it.copy(n07Health = "DISABLED") }
        }
    }

    private suspend fun refreshHardware() {
        val snapshot = hardware.detect()
        dashboard.patch {
            it.copy(
                batteryThermal = "battery=" + (snapshot.batteryLevel?.toString() ?: "unavailable") +
                    "% temp=" + (snapshot.batteryTempC?.toString() ?: "unavailable") +
                    "C thermal=" + snapshot.thermalZones.size,
                queueDepth = dashboard.state.value.queueDepth
            )
        }
        watchdog.check(dashboard.state.value.saraHealth == "ok")
        bus.publish(
            SoulEvent.TelemetryUpdated(
                "battery=" + (snapshot.batteryLevel ?: -1) +
                    ",temp=" + (snapshot.batteryTempC ?: -1.0) +
                    ",thermalZones=" + snapshot.thermalZones.size
            )
        )
    }

    private fun scheduleLogSync() {
        val request = PeriodicWorkRequestBuilder<LogSyncWorker>(15, TimeUnit.MINUTES)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()
        WorkManager.getInstance(appContext).enqueueUniquePeriodicWork(
            "soul-log-sync",
            ExistingPeriodicWorkPolicy.KEEP,
            request
        )
    }

    suspend fun runCycle(input: String, cycleId: String? = null) {
        val id = missions.enqueueCycleMission(input, cycleId)
        bus.publish(SoulEvent.MissionProgress(id.toString(), "ENQUEUED", "SARA cycle"))
    }

    fun pauseMissions(reason: String) = missions.pause(reason)
    fun resumeMissions() = missions.resume()
    fun watchdog(): AndroidWatchdog = watchdog
    fun dashboard(): DashboardStateStore = dashboard
    fun sara(): SaraClient = sara
    fun n07(): N07Client = n07
    fun feedback(): FeedbackRepository = feedback

    fun stop() {
        job?.cancel()
        job = null
        missions.pause("RUNTIME_STOPPED")
    }
}
