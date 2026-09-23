package com.divibisoul.soul.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.TimeUnit

class HortaCoreException(val code: String, message: String) : Exception(message)

class HortaCoreClient(private val configStore: SecureEndpointConfigStore) {
    private val media = "application/json; charset=utf-8".toMediaType()

    private suspend fun execute(
        operation: String,
        metadata: JSONObject = JSONObject(),
        correlationId: String = UUID.randomUUID().toString(),
    ): JSONObject = withContext(Dispatchers.IO) {
        val cfg = configStore.read()
        if (!cfg.n07Enabled) throw HortaCoreException("N07_DISABLED", "N07 feature is disabled")
        val base = cfg.n07BaseUrl ?: throw HortaCoreException("N07_DISABLED", "N07_BASE_URL not configured")
        val token = configStore.n07Token() ?: throw HortaCoreException("N07_UNAUTHORIZED", "N07_TOKEN not configured")
        val body = JSONObject()
            .put("operation", operation)
            .put("payload", JSONArray())
            .put("metadata", metadata)
            .put("correlationId", correlationId)
        val request = Request.Builder()
            .url(base + "/v1/execute")
            .header("Authorization", "Bearer " + token)
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")
            .header("X-Correlation-ID", correlationId)
            .post(body.toString().toRequestBody(media))
            .build()
        val client = OkHttpClient.Builder()
            .connectTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .readTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .writeTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .callTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .build()
        val response = runCatching { client.newCall(request).execute() }
            .getOrElse { throw HortaCoreException("HORTACORE_UNAVAILABLE", it.message ?: "HortaCore transport unavailable") }
        response.use {
            val text = it.body?.string().orEmpty()
            if (!it.isSuccessful) {
                val code = if (it.code == 401 || it.code == 403) "HORTACORE_UNAUTHORIZED" else "HORTACORE_UNAVAILABLE"
                throw HortaCoreException(code, text.ifBlank { "HTTP " + it.code })
            }
            try {
                JSONObject(text)
            } catch (error: Exception) {
                throw HortaCoreException("HORTACORE_INVALID_RESPONSE", error.message ?: "Invalid HortaCore response")
            }
        }
    }

    suspend fun describe(correlationId: String = UUID.randomUUID().toString()) =
        execute("hortacore.describe@1.0.0", correlationId = correlationId)

    suspend fun health(correlationId: String = UUID.randomUUID().toString()) =
        execute("hortacore.health@1.0.0", correlationId = correlationId)

    suspend fun sync(correlationId: String = UUID.randomUUID().toString()) =
        execute("hortacore.sync@1.0.0", correlationId = correlationId)

    suspend fun signal(signal: String, level: Int = 0, correlationId: String = UUID.randomUUID().toString()) =
        execute(
            "hortacore.signal@1.0.0",
            JSONObject()
                .put("signal", signal)
                .put("level", level.toString()),
            correlationId,
        )
}
