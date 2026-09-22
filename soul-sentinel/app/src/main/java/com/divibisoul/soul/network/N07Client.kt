package com.divibisoul.soul.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class N07Exception(val code: String, message: String) : Exception(message)

class N07Client(private val configStore: SecureEndpointConfigStore) {
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    private suspend fun request(method: String, path: String, body: JSONObject? = null): JSONObject = withContext(Dispatchers.IO) {
        val cfg = configStore.read()
        val base = cfg.n07BaseUrl ?: throw N07Exception("N07_DISABLED", "N07_BASE_URL not configured")
        val token = configStore.n07Token() ?: throw N07Exception("N07_UNAUTHORIZED", "N07_TOKEN not configured")
        val builder = Request.Builder()
            .url(base + path)
            .header("Authorization", "Bearer " + token)
            .header("Content-Type", "application/json")

        if (method == "POST") builder.post((body ?: JSONObject()).toString().toRequestBody(jsonMedia))
        else builder.get()

        val client = OkHttpClient.Builder()
            .connectTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .readTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .writeTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .callTimeout(cfg.requestTimeoutMs, TimeUnit.MILLISECONDS)
            .build()

        val response = try {
            client.newCall(builder.build()).execute()
        } catch (e: Exception) {
            throw N07Exception("N07_UNAVAILABLE", e.message ?: "N07 transport unavailable")
        }

        response.use {
            val text = it.body?.string().orEmpty()
            if (!it.isSuccessful) {
                val code = if (it.code == 401 || it.code == 403) "N07_UNAUTHORIZED" else "N07_UNAVAILABLE"
                throw N07Exception(code, text.ifBlank { "HTTP " + it.code })
            }
            return@withContext try {
                JSONObject(text)
            } catch (e: Exception) {
                throw N07Exception("N07_INVALID_RESPONSE", e.message ?: "Invalid JSON")
            }
        }
    }

    suspend fun health() = request("GET", "/v1/health")
    suspend fun capabilities() = request("GET", "/v1/capabilities")

    suspend fun execute(operation: String, payload: JSONObject, correlationId: String) =
        request(
            "POST",
            "/v1/execute",
            JSONObject()
                .put("operation", operation)
                .put("payload", payload)
                .put("metadata", JSONObject().put("correlation_id", correlationId))
        )

    suspend fun intent(input: String, correlationId: String) =
        request(
            "POST",
            "/v1/intent",
            JSONObject()
                .put("input", input)
                .put("metadata", JSONObject().put("correlation_id", correlationId))
        )
}
