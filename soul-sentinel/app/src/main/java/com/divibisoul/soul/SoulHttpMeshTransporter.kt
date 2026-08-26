package com.divibisoul.soul

import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

/** Real remote transport for nuclei that are not hosted inside the APK. */
class SoulHttpMeshTransporter(
    private val endpoints: Map<String, String>,
    private val connectTimeoutMs: Int = 10_000,
    private val readTimeoutMs: Int = 30_000,
) : SoulMeshTransporter {
    override fun send(message: SoulMeshMessage): SoulMeshMessage {
        message.validate().getOrThrow()
        val base = endpoints[message.target]
            ?: error("NO_REMOTE_ENDPOINT: nucleus ${message.target}")
        val url = URL(base.trimEnd('/') + "/api/soul-mesh")
        val connection = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = connectTimeoutMs
            readTimeout = readTimeoutMs
            doOutput = true
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
            setRequestProperty("Accept", "application/json")
        }
        try {
            connection.outputStream.use { it.write(message.toJson().toString().toByteArray(Charsets.UTF_8)) }
            val status = connection.responseCode
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val body = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            if (status !in 200..299) error("MESH_HTTP_$status: $body")
            return SoulMeshMessage.fromJson(JSONObject(body))
        } finally {
            connection.disconnect()
        }
    }
}
