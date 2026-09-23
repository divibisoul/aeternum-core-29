package com.divibisoul.soul.data

import com.divibisoul.soul.network.SecureEndpointConfigStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class LogSynchronizer(
    private val repository: FeedbackRepository,
    private val configStore: SecureEndpointConfigStore
) {
    suspend fun sync(): Result<Int> = withContext(Dispatchers.IO) {
        val cfg = configStore.feedbackSyncUrl() ?: return@withContext Result.failure(
            IllegalStateException("FEEDBACK_SYNC_UNCONFIGURED")
        )
        repository.purge(configStore.read().logRetentionDays)
        val pending = repository.pending()
        if (pending.isEmpty()) return@withContext Result.success(0)

        val events = JSONArray()
        pending.forEach { events.put(JSONObject()
            .put("id", it.id)
            .put("timestamp", it.timestamp)
            .put("type", it.type)
            .put("payload", JSONObject.wrap(it.payload))
        ) }

        val request = Request.Builder()
            .url(cfg)
            .post(events.toString().toRequestBody("application/json".toMediaType()))
            .build()

        val client = OkHttpClient.Builder().callTimeout(15, TimeUnit.SECONDS).build()
        val response = runCatching { client.newCall(request).execute() }
            .getOrElse { return@withContext Result.failure(it) }
        response.use {
            if (!it.isSuccessful) return@withContext Result.failure(
                IllegalStateException("FEEDBACK_SYNC_HTTP_" + it.code)
            )
        }
        repository.markSynced(pending.map(LogEntity::id))
        Result.success(pending.size)
    }
}
