package com.divibisoul.soul

import java.net.HttpURLConnection
import java.net.URL

/** Concrete Android HTTP transport for server-backed Mesh messages. */
class SoulMeshTransport(private val endpoints: Map<String, String>) : SoulMeshTransporter {
    override fun send(message: SoulMeshMessage): SoulMeshMessage {
        message.validate().getOrThrow()
        val endpoint = endpoints[message.target] ?: error("No transport endpoint for ${message.target}")
        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 10_000
            readTimeout = 10_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
        }
        connection.outputStream.use { it.write(message.toJson().toString().toByteArray(Charsets.UTF_8)) }
        val body = (if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream)
            ?.bufferedReader()?.use { it.readText() }
            ?: error("Empty Mesh response: HTTP ${connection.responseCode}")
        return SoulMeshMessage.fromJson(org.json.JSONObject(body))
    }
}
