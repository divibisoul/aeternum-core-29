package com.divibisoul.soul

import java.net.HttpURLConnection
import java.net.URL

/** HTTP transport implementing the same logical Mesh contract as local/WebView transports. */
class SoulMeshTransport(private val endpoints: Map<String, String>) : SoulMeshTransporter {
    override fun send(message: SoulMeshMessage): SoulMeshMessage {
        message.validate().getOrThrow()
        val endpoint = endpoints[message.target] ?: error("No transport endpoint for ${message.target}")
        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 10_000
            readTimeout = 15_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("X-Soul-Mesh-Protocol", SoulMeshEnvelope.PROTOCOL)
            setRequestProperty("X-Soul-Mesh-Source", message.source)
            setRequestProperty("X-Soul-Mesh-Correlation-Id", message.correlationId)
        }
        SoulMeshEnvelope.encode(message).let { bytes ->
            connection.outputStream.use { it.write(bytes) }
        }
        val status = connection.responseCode
        val stream = if (status in 200..299) connection.inputStream else connection.errorStream
        val body = stream?.bufferedReader()?.use { it.readText() }
            ?: error("Empty Mesh response: HTTP $status")
        return SoulMeshEnvelope.decode(body.toByteArray(Charsets.UTF_8))
            .also { response ->
                require(response.correlationId == message.correlationId) { "Mesh correlationId mismatch" }
                require(response.source == message.target) { "Unexpected Mesh response source" }
                require(response.target == message.source) { "Unexpected Mesh response target" }
            }
    }
}
