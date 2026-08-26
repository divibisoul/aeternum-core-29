package com.divibisoul.soul

import org.json.JSONObject
import java.time.Instant
import java.util.UUID
import java.util.concurrent.Callable
import java.util.concurrent.Executors

/**
 * Native APK access to the complete 60-channel logical fabric.
 * Each channel is multiplexed over the peer's canonical /api/soul-mesh receiver;
 * channelId preserves the five-slot identity. A channel is only reported reachable
 * when the peer returns a correlated response.
 */
class SoulMesh60ChannelAccess(
    private val peerEndpoints: Map<String, String>,
    private val sourceNucleus: String = "N01",
) {
    data class Result(
        val channelId: String,
        val target: String,
        val configured: Boolean,
        val reachable: Boolean,
        val correlationId: String,
        val error: String? = null,
    )

    private val transport = SoulMeshHttpTransport(sourceNucleus)

    fun allChannelIds(): List<String> {
        val nuclei = listOf("N01", "N02", "N03", "N04", "N05", "N06")
        return nuclei.flatMap { source ->
            nuclei.filter { it != source }.flatMap { target ->
                (1..5).flatMap { slot ->
                    listOf("$source.OUT.$slot.$target", "$source.IN.$slot.$target")
                }
            }
        }
    }

    fun probeAll(): List<Result> {
        val executor = Executors.newFixedThreadPool(6)
        return try {
            executor.invokeAll(allChannelIds().map { channelId -> Callable { probe(channelId) } }).map { it.get() }
        } finally {
            executor.shutdown()
        }
    }

    private fun probe(channelId: String): Result {
        val parts = channelId.split('.')
        val source = if (parts[1] == "OUT") parts[0] else parts[0]
        val target = if (parts[1] == "OUT") parts[3] else parts[3]
        val peer = if (source == sourceNucleus) target else source
        val base = peerEndpoints[peer]
        val correlationId = UUID.randomUUID().toString()
        if (base.isNullOrBlank()) return Result(channelId, peer, false, false, correlationId, "PEER_ENDPOINT_NOT_CONFIGURED")
        val url = base.trimEnd('/') + "/api/soul-mesh"
        val message = SoulMeshMessage(
            id = UUID.randomUUID().toString(),
            correlationId = correlationId,
            source = sourceNucleus,
            target = peer,
            kind = "request",
            capability = "mesh.ping",
            payload = JSONObject().put("channelId", channelId).put("surface", "APK"),
            timestamp = Instant.now().toString(),
            channelId = channelId,
        )
        return transport.send(url, message).fold(
            onSuccess = { response ->
                Result(channelId, peer, true, response.correlationId == correlationId, correlationId,
                    if (response.correlationId == correlationId) null else "CORRELATION_MISMATCH")
            },
            onFailure = { error -> Result(channelId, peer, true, false, correlationId, error.message ?: "MESH_TRANSPORT_ERROR") },
        )
    }
}
