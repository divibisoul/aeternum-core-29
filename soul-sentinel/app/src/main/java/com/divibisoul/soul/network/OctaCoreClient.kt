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

data class OctaCoreJob(
    val jobId: String,
    val correlationId: String,
    val kind: String,
    val source: String,
    val target: String,
    val backendPrefs: List<String>,
    val parallelGroup: String? = null,
    val barrier: String? = null,
    val payload: JSONObject = JSONObject(),
    val priority: Int = 90,
    val ttlMs: Long = 30_000L
) {
    fun toJson(): JSONObject = JSONObject()
        .put("job_id", jobId)
        .put("correlation_id", correlationId)
        .put("kind", kind)
        .put("source", source)
        .put("target", target)
        .put("backend_prefs", JSONArray(backendPrefs))
        .putOpt("parallel_group", parallelGroup)
        .putOpt("barrier", barrier)
        .put("payload", payload)
        .put("priority", priority)
        .put("ttl_ms", ttlMs)
}

class OctaCoreException(val code: String, message: String) : Exception(message)

class OctaCoreClient(private val configStore: SecureEndpointConfigStore) {
    private val media = "application/json; charset=utf-8".toMediaType()

    private suspend fun request(
        method: String,
        path: String,
        body: JSONObject? = null,
        correlationId: String = UUID.randomUUID().toString()
    ): JSONObject = withContext(Dispatchers.IO) {
        val cfg = configStore.read()
        if (!cfg.n07Enabled) throw OctaCoreException("N07_DISABLED", "N07 feature is disabled")
        val base = cfg.n07BaseUrl ?: throw OctaCoreException("N07_DISABLED", "N07_BASE_URL not configured")
        val token = configStore.n07Token() ?: throw OctaCoreException("N07_UNAUTHORIZED", "N07_TOKEN not configured")
        val builder = Request.Builder()
            .url(base + path)
            .header("Authorization", "Bearer $token")
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")
            .header("X-Correlation-ID", correlationId)
        if (method == "POST") {
            builder.post((body ?: JSONObject()).toString().toRequestBody(media))
        } else {
            builder.get()
        }
        val client = OkHttpClient.Builder()
            .connectTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .readTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .writeTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .callTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .build()
        val response = runCatching { client.newCall(builder.build()).execute() }
            .getOrElse { throw OctaCoreException("OCTACORE_UNAVAILABLE", it.message ?: "Octacore transport unavailable") }
        response.use {
            val text = it.body?.string().orEmpty()
            if (!it.isSuccessful) {
                val code = if (it.code == 401 || it.code == 403) "OCTACORE_UNAUTHORIZED" else "OCTACORE_UNAVAILABLE"
                throw OctaCoreException(code, text.ifBlank { "HTTP " + it.code })
            }
            try {
                JSONObject(text)
            } catch (error: Exception) {
                throw OctaCoreException("OCTACORE_INVALID_RESPONSE", error.message ?: "Invalid JSON")
            }
        }
    }

    suspend fun health(correlationId: String = UUID.randomUUID().toString()) =
        request("GET", "/v1/octacore/health", correlationId = correlationId)

    suspend fun inventory(correlationId: String = UUID.randomUUID().toString()) =
        request("GET", "/v1/octacore/inventory", correlationId = correlationId)

    suspend fun submit(job: OctaCoreJob) =
        request("POST", "/v1/octacore/submit", job.toJson(), job.correlationId)

    suspend fun batch(jobs: List<OctaCoreJob>, correlationId: String = UUID.randomUUID().toString()) =
        request(
            "POST",
            "/v1/octacore/batch",
            JSONObject().put(
                "jobs",
                JSONArray().apply { jobs.forEach { put(it.toJson()) } }
            ),
            correlationId
        )

    suspend fun executeFederatedContextCycle(
        input: String,
        researchPayload: JSONObject,
        perceptionPayload: JSONObject?,
        allowResearchSkip: Boolean,
        correlationId: String = UUID.randomUUID().toString()
    ) = withContext(Dispatchers.IO) {
        val metadata = JSONObject()
            .put("octacore_input", input)
            .put("research_payload_json", researchPayload.toString())
            .put("allow_research_skip", allowResearchSkip.toString())
        if (perceptionPayload != null) metadata.put("perception_payload_json", perceptionPayload.toString())
        val body = JSONObject()
            .put("operation", "octacore.federated_context_cycle@1.0.0")
            .put("payload", JSONArray())
            .put("metadata", metadata)
            .put("correlationId", correlationId)
        val cfg = configStore.read()
        if (!cfg.n07Enabled) throw OctaCoreException("N07_DISABLED", "N07 feature is disabled")
        val base = cfg.n07BaseUrl ?: throw OctaCoreException("N07_DISABLED", "N07_BASE_URL not configured")
        val token = configStore.n07Token() ?: throw OctaCoreException("N07_UNAUTHORIZED", "N07_TOKEN not configured")
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
            .getOrElse { throw OctaCoreException("OCTACORE_UNAVAILABLE", it.message ?: "N07 execute unavailable") }
        response.use {
            val text = it.body?.string().orEmpty()
            if (!it.isSuccessful) {
                val code = if (it.code == 401 || it.code == 403) "OCTACORE_UNAUTHORIZED" else "OCTACORE_UNAVAILABLE"
                throw OctaCoreException(code, text.ifBlank { "HTTP " + it.code })
            }
            try {
                JSONObject(text)
            } catch (error: Exception) {
                throw OctaCoreException("OCTACORE_INVALID_RESPONSE", error.message ?: "Invalid N07 execute response")
            }
        }
    }
}
