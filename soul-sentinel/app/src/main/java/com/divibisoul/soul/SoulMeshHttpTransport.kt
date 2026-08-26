package com.divibisoul.soul

import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.InetAddress
import java.net.ServerSocket
import java.net.URL
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/** HTTP transport for Soul Mesh v1. Loopback is the default bind for local runtime communication. */
class SoulMeshHttpTransport(
    private val sourceNucleus: String,
    private val bindHost: String = "127.0.0.1",
    private val port: Int = 8765,
    private val path: String = "/soul/mesh/v1",
) {
    private val executor: ExecutorService = Executors.newCachedThreadPool()
    @Volatile private var serverSocket: ServerSocket? = null
    @Volatile private var running = false
    @Volatile private var responseHandler: ((SoulMeshMessage) -> SoulMeshMessage)? = null

    fun start(onMessage: (SoulMeshMessage) -> Unit): Result<Unit> = startInternal(onMessage)

    /** Starts the transport with a real endpoint response, enabling request -> ACK/response RPC. */
    fun startWithResponse(onMessage: (SoulMeshMessage) -> SoulMeshMessage): Result<Unit> {
        responseHandler = onMessage
        return startInternal({})
    }

    fun stop() {
        running = false
        responseHandler = null
        runCatching { serverSocket?.close() }
        serverSocket = null
    }

    fun send(url: String, message: SoulMeshMessage): Result<SoulMeshMessage> = runCatching {
        require(message.source == sourceNucleus) { "Message source does not match transport nucleus" }
        message.validate().getOrThrow()
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 5_000
            readTimeout = 10_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
            setRequestProperty("Accept", "application/json")
        }
        connection.outputStream.use { it.write(message.toJson().toString().toByteArray(StandardCharsets.UTF_8)) }
        val status = connection.responseCode
        val stream = if (status in 200..299) connection.inputStream else connection.errorStream
        val body = stream?.bufferedReader(StandardCharsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
        connection.disconnect()
        require(status in 200..299) { "Mesh transport HTTP $status" }
        SoulMeshMessage.fromJson(JSONObject(body))
    }

    private fun startInternal(onMessage: (SoulMeshMessage) -> Unit): Result<Unit> {
        if (running) return Result.success(Unit)
        return runCatching {
            val socket = ServerSocket(port, 50, InetAddress.getByName(bindHost))
            serverSocket = socket
            running = true
            executor.execute {
                while (running) {
                    try {
                        val client = socket.accept()
                        executor.execute { handle(client, onMessage) }
                    } catch (_: Exception) {
                        if (running) break
                    }
                }
            }
        }
    }

    private fun handle(client: java.net.Socket, onMessage: (SoulMeshMessage) -> Unit) {
        client.use { socket ->
            val reader = BufferedReader(InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8))
            val requestLine = reader.readLine() ?: return
            val headers = mutableMapOf<String, String>()
            while (true) {
                val line = reader.readLine() ?: return
                if (line.isEmpty()) break
                val separator = line.indexOf(':')
                if (separator > 0) headers[line.substring(0, separator).trim().lowercase()] = line.substring(separator + 1).trim()
            }
            val method = requestLine.substringBefore(' ')
            val requestPath = requestLine.substringAfter(' ').substringBefore(' ')
            val length = headers["content-length"]?.toIntOrNull() ?: 0
            if (method != "POST" || requestPath != path || length <= 0 || length > 1_048_576) {
                writeResponse(socket, 400, JSONObject().put("error", "Invalid Mesh HTTP request")); return
            }
            val body = CharArray(length)
            var read = 0
            while (read < length) {
                val count = reader.read(body, read, length - read)
                if (count < 0) break
                read += count
            }
            if (read != length) { writeResponse(socket, 400, JSONObject().put("error", "Incomplete body")); return }
            try {
                val message = SoulMeshMessage.fromJson(JSONObject(String(body)))
                onMessage(message)
                val response = responseHandler?.invoke(message) ?: SoulMeshMessage(
                    id = UUID.randomUUID().toString(),
                    correlationId = message.correlationId,
                    source = sourceNucleus,
                    target = message.source,
                    kind = "ack",
                    capability = message.capability,
                    payload = JSONObject().put("accepted", true),
                    timestamp = Instant.now().toString(),
                )
                writeResponse(socket, 200, response.toJson())
            } catch (error: Exception) {
                writeResponse(socket, 400, JSONObject().put("error", error.message ?: "Invalid Mesh message"))
            }
        }
    }

    private fun writeResponse(socket: java.net.Socket, status: Int, body: JSONObject) {
        val bytes = body.toString().toByteArray(StandardCharsets.UTF_8)
        val reason = if (status == 200) "OK" else "Bad Request"
        val headers = "HTTP/1.1 $status $reason\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: ${bytes.size}\r\nConnection: close\r\n\r\n"
        socket.getOutputStream().use { output -> output.write(headers.toByteArray(StandardCharsets.UTF_8)); output.write(bytes); output.flush() }
    }
}
