package com.divibisoul.soul.runtime

import android.content.Context
import androidx.work.Constraints
import androidx.work.BackoffPolicy
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.divibisoul.soul.SoulRuntimeBusHolder
import com.divibisoul.soul.core.SoulEvent
import com.divibisoul.soul.core.state.DashboardStateStore
import com.divibisoul.soul.data.FeedbackRepository
import com.divibisoul.soul.network.SaraClient
import com.divibisoul.soul.network.SecureEndpointConfigStore
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.TimeUnit

class MissionControl(context: Context) {
    private val appContext = context.applicationContext
    private val work = WorkManager.getInstance(appContext)
    private val _paused = MutableStateFlow(false)
    val paused: StateFlow<Boolean> = _paused.asStateFlow()

    fun enqueueCycleMission(input: String, cycleId: String? = null): UUID {
        if (_paused.value) throw IllegalStateException("MISSIONS_PAUSED")
        val request = OneTimeWorkRequestBuilder<CycleMissionWorker>()
            .addTag("soul-mission")
            .setInputData(
                Data.Builder()
                    .putString("input", input)
                    .putString("cycle_id", cycleId)
                    .build()
            )
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 5, TimeUnit.SECONDS)
            .build()
        work.enqueueUniqueWork("soul-cycle-" + (cycleId ?: UUID.randomUUID()), ExistingWorkPolicy.APPEND_OR_REPLACE, request)
        return request.id
    }

    fun isPaused(): Boolean = _paused.value

    fun pause(reason: String) {
        _paused.value = true
        work.cancelAllWorkByTag("soul-mission")
        // Reason is persisted by the watchdog/feedback integration, not discarded.
    }

    fun resume() { _paused.value = false }
}

class CycleMissionWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val config = SecureEndpointConfigStore(applicationContext)
        val sara = SaraClient(config)
        val repo = FeedbackRepository(applicationContext)
        return try {
            val input = inputData.getString("input")
                ?: return Result.failure(Data.Builder().putString("error", "MISSION_INPUT_MISSING").build())
            val cycleId = inputData.getString("cycle_id")
            val correlation = UUID.randomUUID().toString()
            val result = sara.cycle(input, cycleId, correlation)
            val dashboard = DashboardStateStore(applicationContext)
            dashboard.load()
            dashboard.patch {
                it.copy(
                    lastCycleId = result.cycleId,
                    lastTraceHash = result.traceHash
                )
            }
            (SoulRuntimeBusHolder.bus ?: SoulRuntimeBusHolder.create()).publish(
                SoulEvent.SaraCycleCompleted(
                    cycleId = result.cycleId,
                    correlationId = result.correlationId,
                    traceHash = result.traceHash,
                    converged = result.converged,
                    rollbackPerformed = result.rollbackPerformed
                )
            )
            repo.append(
                "SaraCycleCompleted",
                JSONObject()
                    .put("cycle_id", result.cycleId)
                    .put("correlation_id", result.correlationId)
                    .put("converged", result.converged)
                    .put("rollback_performed", result.rollbackPerformed)
                    .put("trace_hash", result.traceHash)
                    .toString()
            )
            Result.success()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            val dashboard = DashboardStateStore(applicationContext)
            dashboard.load()
            dashboard.patch {
                it.copy(errors = (it.errors + ((e as? com.divibisoul.soul.network.SaraException)?.code ?: "MISSION_ERROR")).takeLast(50))
            }
            repo.append(
                "SaraCycleFailed",
                JSONObject()
                    .put("code", (e as? com.divibisoul.soul.network.SaraException)?.code ?: "MISSION_ERROR")
                    .put("message", e.message ?: "unknown")
                    .toString()
            )
            if (e is com.divibisoul.soul.network.SaraException && e.code == "SARA_UNAVAILABLE") {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
}
