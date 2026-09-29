package com.divibisoul.soul.network

import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.TimeUnit

class SaraException(val code: String, message: String) : Exception(message)

data class SaraCycleResult(
    val cycleId: String,
    val correlationId: String,
    val converged: Boolean?,
    val rollbackPerformed: Boolean?,
    val traceHash: String?
)

class SaraClient(private val configStore: SecureEndpointConfigStore) {
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    private suspend fun request(
        method: String,
        path: String,
        body: JSONObject? = null,
        authenticated: Boolean = true,
        correlationId: String = UUID.randomUUID().toString()
    ): JSONObject = withContext(Dispatchers.IO) {
        val cfg = configStore.read()
        val base = cfg.saraBaseUrl ?: throw SaraException("SARA_UNAVAILABLE", "SARA_BASE_URL not configured")
        val builder = Request.Builder()
            .url(base + path)
            .header("X-Correlation-ID", correlationId)

        if (authenticated) {
            val token = configStore.saraToken()
            if (token.isNullOrBlank()) throw SaraException("SARA_UNAUTHORIZED", "SARA_API_TOKEN not configured")
            builder.header("Authorization", "Bearer " + token)
        }

        if (method == "POST") {
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
            throw SaraException("SARA_UNAVAILABLE", e.message ?: "SARA transport unavailable")
        }

        response.use {
            val text = it.body?.string().orEmpty()
            if (!it.isSuccessful) {
                val code = when (it.code) {
                    401, 403 -> "SARA_UNAUTHORIZED"
                    else -> "SARA_UNAVAILABLE"
                }
                throw SaraException(code, text.ifBlank { "HTTP " + it.code })
            }
            return@withContext try {
                JSONObject(text)
            } catch (e: Exception) {
                throw SaraException("SARA_INVALID_RESPONSE", e.message ?: "Invalid JSON")
            }
        }
    }

    suspend fun health() = request("GET", "/health", authenticated = false)
    suspend fun capabilities() = request("GET", "/v1/capabilities")
    suspend fun state() = request("GET", "/v1/state")

    suspend fun cycle(
        input: String,
        cycleId: String? = null,
        correlationId: String = UUID.randomUUID().toString()
    ): SaraCycleResult {
        val body = JSONObject().put("input", input)
        if (cycleId != null) body.put("cycle_id", cycleId)
        val result = request("POST", "/v1/cycle", body, correlationId = correlationId)
        return SaraContractParser.cycle(result, correlationId)
    }

    suspend fun audit(input: String, correlationId: String = UUID.randomUUID().toString()) =
        request("POST", "/v1/audit", JSONObject().put("input", input), correlationId = correlationId)

    suspend fun regenerate(input: String, correlationId: String = UUID.randomUUID().toString()) =
        request("POST", "/v1/regenerate", JSONObject().put("input", input), correlationId = correlationId)

    suspend fun trace(cycleId: String, correlationId: String = UUID.randomUUID().toString()) =
        request("GET", "/v1/trace/" + Uri.encode(cycleId), correlationId = correlationId)
}
