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

class N07Exception(val code: String, message: String) : Exception(message)

class N07Client(private val configStore: SecureEndpointConfigStore) {
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    private suspend fun request(
        method: String,
        path: String,
        body: JSONObject? = null,
        correlationId: String = UUID.randomUUID().toString()
    ): JSONObject = withContext(Dispatchers.IO) {
        val cfg = configStore.read()
        if (!cfg.n07Enabled) {
            throw N07Exception("N07_DISABLED", "FEATURE_N07_ENABLED is disabled")
        }
        val base = cfg.n07BaseUrl ?: throw N07Exception("N07_DISABLED", "N07_BASE_URL not configured")
        val token = configStore.n07Token() ?: throw N07Exception("N07_UNAUTHORIZED", "N07_TOKEN not configured")
        val builder = Request.Builder()
            .url(base + path)
            .header("Authorization", "Bearer " + token)
            .header("Content-Type", "application/json")
            .header("X-Correlation-ID", correlationId)

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

    suspend fun health(correlationId: String = UUID.randomUUID().toString()) =
        request("GET", "/v1/health", correlationId = correlationId)

    suspend fun capabilities(correlationId: String = UUID.randomUUID().toString()) =
        request("GET", "/v1/capabilities", correlationId = correlationId)

    /**
     * N07 /v1/execute requires a numeric JSON array payload.
     * This overload keeps the previous JSONObject entry point but requires the
     * caller to provide its numeric array in a "values" field; no object payload
     * is silently sent to the []float64 contract.
     */
    suspend fun execute(operation: String, payload: JSONObject, correlationId: String): JSONObject {
        val values = payload.optJSONArray("values")
            ?: throw N07Exception("N07_INVALID_REQUEST", "N07 execute payload requires numeric array field 'values'")
        return execute(operation, values, correlationId)
    }

    suspend fun execute(operation: String, payload: JSONArray, correlationId: String) =
        request(
            "POST",
            "/v1/execute",
            JSONObject()
                .put("operation", operation)
                .put("payload", payload)
                .put("metadata", JSONObject().put("correlation_id", correlationId))
                .put("correlationId", correlationId),
            correlationId = correlationId
        )

    /**
     * N07 /v1/intent requires a tool plus a structured input object.
     */
    suspend fun intent(tool: String, input: JSONObject, correlationId: String) =
        request(
            "POST",
            "/v1/intent",
            JSONObject()
                .put("tool", tool)
                .put("input", input)
                .put("correlationId", correlationId),
            correlationId = correlationId
        )

    /**
     * Kept for source compatibility. The old contract carried only a free-form
     * string and therefore could not identify an N07 tool. It now fails explicitly
     * instead of sending a malformed request.
     */
    suspend fun intent(input: String, correlationId: String) =
        throw N07Exception("N07_INVALID_REQUEST", "N07 intent requires tool + structured input; use intent(tool, input, correlationId)")
}
