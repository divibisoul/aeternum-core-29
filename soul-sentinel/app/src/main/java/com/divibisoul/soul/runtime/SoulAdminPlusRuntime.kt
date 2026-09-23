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
import com.divibisoul.soul.network.OctaCoreClient
import com.divibisoul.soul.network.HortaCoreClient
import com.divibisoul.soul.network.HortaCoreException
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
    private val octaCore = OctaCoreClient(config)
    private val hortaCore = HortaCoreClient(config)
    private val root = RootGate()
    private val shizuku = ShizukuOrchestrator()
    private val missions = MissionControl(appContext)
    private val watchdog = AndroidWatchdog(appContext, bus, missions, dashboard, scope)
    private val feedback = FeedbackRepository(appContext)
    private val intentQueue = IntentQueueManager(
        scope = scope,
        onFailure = { intent, error ->
            bus.publish(
                SoulEvent.MissionProgress(
                    intent.id,
                    "FAILED",
                    error.message ?: "Intent execution failed"
                )
            )
            scope.launch(Dispatchers.Default) {
                dashboard.patch {
                    it.copy(
                        errors = (it.errors + "QUEUE_" + intent.id + ":" + (error.message ?: "UNKNOWN")).takeLast(50)
                    )
                }
            }
        }
    )
    private var job: Job? = null

    @Synchronized
    fun start() {
        if (job != null) return
        intentQueue.start()
        shizuku.start()
        job = scope.launch(Dispatchers.Default) {
            dashboard.load()
            refreshBackends()
            refreshHardware()
            if (!watchdog.isLoadReduced()) missions.resume()
            scheduleLogSync()
            while (isActive) {
                dashboard.load()
                val reduced = watchdog.isLoadReduced()
                if (!reduced) {
                    refreshBackends()
                    scheduleLogSync()
                }
                refreshHardware()
                delay(if (reduced) 60_000L else 15_000L)
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
            try {
                val health = octaCore.health()
                dashboard.patch { it.copy(octaCoreHealth = health.optString("status", "UNKNOWN")) }
            } catch (e: Exception) {
                val code = (e as? com.divibisoul.soul.network.OctaCoreException)?.code ?: "OCTACORE_UNAVAILABLE"
                dashboard.patch { it.copy(octaCoreHealth = code, errors = it.errors + code) }
            }
            try {
                val health = hortaCore.health()
                val metadata = health.optJSONObject("metadata")
                val raw = metadata?.optString("hortacore_json").orEmpty()
                val nested = runCatching { JSONObject(raw) }.getOrNull()
                val status = nested?.optJSONObject("octacore")?.optString("status")
                    ?: nested?.optString("status")
                    ?: health.optString("status", "UNKNOWN")
                dashboard.patch { it.copy(hortaCoreHealth = status) }
            } catch (e: Exception) {
                val code = (e as? HortaCoreException)?.code ?: "HORTACORE_UNAVAILABLE"
                dashboard.patch { it.copy(hortaCoreHealth = code, errors = it.errors + code) }
            }
        } else {
            dashboard.patch { it.copy(n07Health = "DISABLED", octaCoreHealth = "DISABLED") }
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
                    " | NPU " + (snapshot.hasNpu?.toString() ?: "UNKNOWN") +
                    " | NNAPI " + snapshot.nnapiAvailable,
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
                    .put("npu_evidence", snapshot.hasNpu)
                    .put("nnapi_available", snapshot.nnapiAvailable)
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
    fun resumeMissions() {
        watchdog.clearProtection()
        missions.resume()
    }
    fun requestShizukuPermission() = shizuku.requestPermissionIfNeeded()
    fun shizukuState() = shizuku.state()
    fun watchdog(): AndroidWatchdog = watchdog
    fun dashboard(): DashboardStateStore = dashboard
    fun sara(): SaraClient = sara
    fun n07(): N07Client = n07
    fun octaCore(): OctaCoreClient = octaCore
    fun hortaCore(): HortaCoreClient = hortaCore
    fun feedback(): FeedbackRepository = feedback

    @Synchronized
    fun stop() {
        job?.cancel()
        job = null
        intentQueue.stop()
        shizuku.stop()
        missions.pause("RUNTIME_STOPPED")
    }
}
