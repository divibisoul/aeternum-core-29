package com.divibisoul.soul

import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

/** Concrete Android HTTP transport for server-backed Mesh messages. */
class SoulMeshTransport(
    private val endpoints: Map<String, String>,
    private val connectTimeoutMs: Int = 10_000,
    private val readTimeoutMs: Int = 10_000,
) : SoulMeshTransporter {
    override fun send(message: SoulMeshMessage): SoulMeshMessage {
        message.validate().getOrThrow()
        val endpoint = endpoints[message.target]
            ?: error("No transport endpoint for ${message.target}")
        require(endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
            "Unsupported Mesh endpoint scheme for ${message.target}"
        }

        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = connectTimeoutMs
            readTimeout = readTimeoutMs
            doOutput = true
            useCaches = false
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("X-Soul-Mesh-Protocol", message.protocol)
            setRequestProperty("X-Soul-Mesh-Contract", SoulMeshContract.CONTRACT_VERSION)
            setRequestProperty("X-Soul-Mesh-Id", message.id)
            setRequestProperty("X-Soul-Mesh-Correlation-Id", message.correlationId)
            setRequestProperty("X-Soul-Mesh-Source", message.source)
            setRequestProperty("X-Soul-Mesh-Target", message.target)
        }

        return try {
            connection.outputStream.use {
                it.write(message.toJson().toString().toByteArray(Charsets.UTF_8))
            }

            val responseCode = connection.responseCode
            val body = (if (responseCode in 200..299) connection.inputStream else connection.errorStream)
                ?.bufferedReader()?.use { it.readText() }
                ?: error("Empty Mesh response: HTTP $responseCode")

            val response = SoulMeshMessage.fromJson(JSONObject(body))
            require(response.correlationId == message.correlationId) {
                "Mesh correlation mismatch: expected ${message.correlationId}, got ${response.correlationId}"
            }
            require(response.source == message.target && response.target == message.source) {
                "Mesh response route mismatch: expected ${message.target}->${message.source}, got ${response.source}->${response.target}"
            }
            if (responseCode !in 200..299 && response.kind != "error") {
                error("Mesh HTTP $responseCode returned a non-error envelope")
            }
            response
        } finally {
            connection.disconnect()
        }
    }
}
