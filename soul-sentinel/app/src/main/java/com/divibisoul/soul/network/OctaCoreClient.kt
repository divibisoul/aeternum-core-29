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

class OctaCoreException(val code: String, message: String) : Exception(message)

class OctaCoreClient(private val configStore: SecureEndpointConfigStore) {
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    private suspend fun request(
        method: String,
        path: String,
        body: JSONObject? = null,
        correlationId: String = UUID.randomUUID().toString(),
    ): JSONObject = withContext(Dispatchers.IO) {
        val cfg = configStore.read()
        if (!cfg.n07Enabled) {
            throw OctaCoreException("OCTACORE_DISABLED", "FEATURE_N07_ENABLED is disabled")
        }
        val base = cfg.n07BaseUrl
            ?: throw OctaCoreException("OCTACORE_DISABLED", "N07_BASE_URL not configured")
        val token = configStore.n07Token()
            ?: throw OctaCoreException("OCTACORE_UNAUTHORIZED", "N07_TOKEN not configured")

        val builder = Request.Builder()
            .url(base + path)
            .header("Authorization", "Bearer $token")
            .header("Accept", "application/json")
            .header("X-Correlation-ID", correlationId)

        if (method == "POST") {
            builder.header("Content-Type", "application/json")
            builder.post((body ?: JSONObject()).toString().toRequestBody(jsonMedia))
        } else {
            builder.get()
        }

        val client = OkHttpClient.Builder()
            .connectTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .readTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .writeTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .callTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .build()

        val response = try {
            client.newCall(builder.build()).execute()
        } catch (e: Exception) {
            throw OctaCoreException("OCTACORE_UNAVAILABLE", e.message ?: "Octacore transport unavailable")
        }

        response.use {
            val raw = it.body?.string().orEmpty()
            if (!it.isSuccessful) {
                val code = when (it.code) {
                    401, 403 -> "OCTACORE_UNAUTHORIZED"
                    404 -> "OCTACORE_NOT_FOUND"
                    408, 429 -> "OCTACORE_RATE_LIMITED"
                    else -> "OCTACORE_UNAVAILABLE"
                }
                throw OctaCoreException(code, raw.ifBlank { "HTTP ${'$'}{it.code}" })
            }
            try {
                JSONObject(raw)
            } catch (e: Exception) {
                throw OctaCoreException("OCTACORE_INVALID_RESPONSE", e.message ?: "Invalid JSON")
            }
        }
    }

    suspend fun health(correlationId: String = UUID.randomUUID().toString()) =
        request("GET", "/v1/octacore/health", correlationId = correlationId)

    suspend fun inventory(correlationId: String = UUID.randomUUID().toString()) =
        request("GET", "/v1/octacore/inventory", correlationId = correlationId)

    suspend fun submit(job: JSONObject, correlationId: String = job.optString("correlation_id").ifBlank { UUID.randomUUID().toString() }) =
        request("POST", "/v1/octacore/submit", job, correlationId)

    suspend fun batch(jobs: JSONArray, correlationId: String = UUID.randomUUID().toString()) =
        request("POST", "/v1/octacore/batch", JSONObject().put("jobs", jobs), correlationId)
}
