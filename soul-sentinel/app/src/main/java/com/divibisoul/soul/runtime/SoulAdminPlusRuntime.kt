package com.divibisoul.soul.runtime

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.divibisoul.soul.core.SoulEvent
import com.divibisoul.soul.core.SoulEventBus
import com.divibisoul.soul.core.hardware.AndroidHardwareAbstraction
import com.divibisoul.soul.core.security.RootGate
import com.divibisoul.soul.core.security.ShizukuOrchestrator
import com.divibisoul.soul.core.state.DashboardStateStore
import com.divibisoul.soul.data.FeedbackRepository
import com.divibisoul.soul.data.LogSyncWorker
import com.divibisoul.soul.network.N07Client
import com.divibisoul.soul.network.SaraClient
import com.divibisoul.soul.network.SecureEndpointConfigStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONObject
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
    private val shizuku = ShizukuOrchestrator()
    private val missions = MissionControl(appContext)
    private val intentQueue = IntentQueueManager(scope)
    private val watchdog = AndroidWatchdog(appContext, bus, missions)
    private val feedback = FeedbackRepository(appContext)
    private var job: Job? = null

    fun start() {
        if (job != null) return
        missions.resume()
        intentQueue.start()
        job = scope.launch(Dispatchers.Default) {
            dashboard.load()
            refreshHardware()
            refreshBackends()
            scheduleLogSync()
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
            dashboard.patch { it.copy(saraHealth = code, errors = it.errors + code) }
            bus.publish(SoulEvent.SaraUnavailable(code))
        }

        val cfg = config.read()
        if (cfg.n07Enabled) {
            try {
                val health = n07.health()
                dashboard.patch { it.copy(n07Health = health.optString("status", "UNKNOWN")) }
            } catch (e: Exception) {
                val code = (e as? com.divibisoul.soul.network.N07Exception)?.code ?: "N07_UNAVAILABLE"
                dashboard.patch { it.copy(n07Health = code, errors = it.errors + code) }
            }
        } else {
            dashboard.patch { it.copy(n07Health = "DISABLED") }
        }

        val cfgForPrivilege = config.read()
        val z = shizuku.state()
        if (z.running && z.permissionGranted) {
            dashboard.patch { it.copy(rootStatus = "SHIZUKU_AVAILABLE") }
            bus.publish(SoulEvent.ShizukuChanged("AVAILABLE"))
        } else if (cfgForPrivilege.rootEnabled && root.status().available) {
            dashboard.patch { it.copy(rootStatus = "ROOT_AVAILABLE") }
            bus.publish(SoulEvent.RootStateChanged("AVAILABLE"))
        } else if (!cfgForPrivilege.rootEnabled) {
            dashboard.patch { it.copy(rootStatus = "ROOT_DISABLED") }
            bus.publish(SoulEvent.RootStateChanged("DISABLED"))
        } else {
            dashboard.patch { it.copy(rootStatus = "NO_PRIVILEGED_CHANNEL") }
            bus.publish(SoulEvent.RootStateChanged("UNAVAILABLE"))
        }
    }

    private suspend fun refreshHardware() {
        val snapshot = hardware.detect()
        dashboard.patch {
            it.copy(
                hardware = snapshot.manufacturer + " " + snapshot.model +
                    " | API " + snapshot.apiLevel +
                    " | CPU cores " + snapshot.cpuCores +
                    " | NPU " + snapshot.hasNpu,
                batteryThermal = "battery=" + (snapshot.batteryLevel?.toString() ?: "unavailable") +
                    "% temp=" + (snapshot.batteryTempC?.toString() ?: "unavailable") +
                    "C thermal=" + hardware.getThermalSnapshot().joinToString("|"),
                queueDepth = intentQueue.depth().toInt()
            )
        }
        watchdog.check(dashboard.state.value.saraHealth == "ok")
        bus.publish(
            SoulEvent.TelemetryUpdated(
                JSONObject()
                    .put("battery", snapshot.batteryLevel)
                    .put("battery_temp_c", snapshot.batteryTempC)
                    .put("thermal_zones", snapshot.thermalZones.size)
                    .put("npu_available", snapshot.hasNpu)
                    .toString()
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
        val id = java.util.UUID.randomUUID().toString()
        intentQueue.enqueue(
            QueuedIntent(
                id = id,
                priority = 100,
                run = {
                    val workId = missions.enqueueCycleMission(input, cycleId)
                    bus.publish(SoulEvent.MissionProgress(workId.toString(), "ENQUEUED", "SARA cycle"))
                }
            )
        )
    }

    fun pauseMissions(reason: String) = missions.pause(reason)
    fun resumeMissions() = missions.resume()
    fun requestShizukuPermission() = shizuku.requestPermissionIfNeeded()
    fun shizukuState() = shizuku.state()
    fun watchdog(): AndroidWatchdog = watchdog
    fun dashboard(): DashboardStateStore = dashboard
    fun sara(): SaraClient = sara
    fun n07(): N07Client = n07
    fun feedback(): FeedbackRepository = feedback

    fun stop() {
        job?.cancel()
        job = null
        intentQueue.stop()
        missions.pause("RUNTIME_STOPPED")
    }
}
