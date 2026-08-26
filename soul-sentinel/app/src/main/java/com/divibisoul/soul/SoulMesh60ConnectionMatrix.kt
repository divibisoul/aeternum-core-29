package com.divibisoul.soul

import java.time.Instant
import java.util.UUID

/**
 * Runtime truth model for the 30 directed peer links (60 channel directions).
 * A channel is only marked reachable after a real runtime probe succeeds.
 */
class SoulMesh60ConnectionMatrix(
    private val runtime: SoulMeshRuntime,
) {
    data class Channel(
        val id: String,
        val source: String,
        val target: String,
        val configured: Boolean,
        val reachable: Boolean,
        val correlationId: String? = null,
        val error: String? = null,
        val checkedAt: String = Instant.now().toString(),
    )

    fun snapshot(): List<Channel> = SoulMeshChannels.directedLinks().map { (source, target) ->
        val configured = runtime.canRoute(target)
        Channel(
            id = "$source.OUT.$target.IN",
            source = source,
            target = target,
            configured = configured,
            reachable = false,
            error = if (configured) "NOT_PROBED" else "NO_ROUTE_CONFIGURED",
        )
    }

    /** Executes a real request through the runtime for one directed channel. */
    fun probe(source: String, target: String): Channel {
        require(source in SoulMeshChannels.nuclei && target in SoulMeshChannels.nuclei && source != target)
        val id = "$source.OUT.$target.IN"
        return runCatching {
            val response = runtime.send(source, target, "mesh.ping", org.json.JSONObject().put("probe", id).put("nonce", UUID.randomUUID().toString()))
            Channel(id, source, target, true, response.payload.optBoolean("ok", true), response.correlationId)
        }.getOrElse { error ->
            Channel(id, source, target, runtime.canRoute(target), false, error = error.message ?: "PROBE_FAILED")
        }
    }

    fun probeAll(): List<Channel> = SoulMeshChannels.directedLinks().map { (source, target) -> probe(source, target) }
}
