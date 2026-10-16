package com.divibisoul.soul

import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.Callable
import java.util.concurrent.Executors

/**
 * Native APK access to the 60 logical IN/OUT surfaces of the six-nucleus AI fabric.
 *
 * This APK can initiate a probe for its own OUT surfaces and for a remote peer's IN
 * surface when that peer receives a request from this APK. An IN surface owned by this
 * local nucleus, a remote OUT surface, or a remote-to-remote surface requires traffic
 * initiated elsewhere and is explicitly reported as not probeable here.
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

    init {
        require(sourceNucleus in SoulMeshChannels.nuclei) {
            "Only an operational AI nucleus can originate APK channel probes: $sourceNucleus"
        }
    }

    /** Exactly 30 OUT surfaces plus their 30 reciprocal IN surfaces; never 300 slot duplicates. */
    fun allChannelIds(): List<String> = SoulMeshChannels.channelIds()

    fun probeAll(): List<Result> {
        val executor = Executors.newFixedThreadPool(6)
        return try {
            executor.invokeAll(allChannelIds().map { channelId -> Callable { probe(channelId) } })
                .map { it.get() }
        } finally {
            executor.shutdown()
        }
    }

    private fun probe(channelId: String): Result {
        val correlationId = UUID.randomUUID().toString()
        val parts = channelId.split('.')
        if (parts.size != 4 || channelId !in allChannelIds()) {
            return Result(channelId, sourceNucleus, false, false, correlationId, "UNKNOWN_CHANNEL_ID")
        }

        val owner = parts[0]
        val direction = parts[1]
        val peer = parts[3]
        // OUT owner -> peer; IN peer -> owner. The transport target follows that direction.
        val destination = if (direction == "OUT") peer else owner
        val canInitiateFromThisApk =
            (direction == "OUT" && owner == sourceNucleus) ||
                (direction == "IN" && owner != sourceNucleus && peer == sourceNucleus)

        val base = peerEndpoints[destination]
        if (!canInitiateFromThisApk) {
            return Result(
                channelId = channelId,
                target = destination,
                configured = !base.isNullOrBlank(),
                reachable = false,
                correlationId = correlationId,
                error = "SURFACE_NOT_PROBEABLE_FROM_$sourceNucleus",
            )
        }
        if (base.isNullOrBlank()) {
            return Result(
                channelId = channelId,
                target = destination,
                configured = false,
                reachable = false,
                correlationId = correlationId,
                error = "PEER_ENDPOINT_NOT_CONFIGURED",
            )
        }

        val url = base.trimEnd('/') + "/api/soul-mesh"
        val message = SoulMeshMessage(
            id = UUID.randomUUID().toString(),
            correlationId = correlationId,
            source = sourceNucleus,
            target = destination,
            kind = "request",
            capability = "mesh.ping",
            payload = JSONObject()
                .put("channelId", channelId)
                .put("surfaceOwner", owner)
                .put("surfaceDirection", direction)
                .put("surface", "APK"),
            timestamp = System.currentTimeMillis(),
        )
        return transport.send(url, message).fold(
            onSuccess = { response ->
                if (response.kind == "response") {
                    Result(channelId, destination, true, true, correlationId)
                } else {
                    val remoteCode = response.payload.optString("code")
                        .ifBlank { response.payload.optString("error") }
                        .ifBlank { "REMOTE_MESH_ERROR" }
                    Result(channelId, destination, true, false, correlationId, "REMOTE_MESH_ERROR:$remoteCode")
                }
            },
            onFailure = { error ->
                Result(
                    channelId,
                    destination,
                    true,
                    false,
                    correlationId,
                    error.message ?: "MESH_TRANSPORT_ERROR",
                )
            },
        )
    }
}
