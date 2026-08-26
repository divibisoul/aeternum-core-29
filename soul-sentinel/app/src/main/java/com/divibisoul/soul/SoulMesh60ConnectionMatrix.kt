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

    /** Executes a real request through the runtime. N01 is the physical caller; the target's correlated response proves the return direction. */
    fun probe(source: String, target: String): Channel {
        require(source == "N01") { "N01 can directly originate only N01.OUT channels; remote-origin probes must execute in the remote runtime." }
        require(target in SoulMeshChannels.nuclei && target != "N01")
        val id = "$source.OUT.$target.IN"
        return runCatching {
            val response = runtime.send(source, target, "mesh.ping", org.json.JSONObject().put("probe", id).put("nonce", UUID.randomUUID().toString()))
            val ok = response.kind == "response" && response.correlationId.isNotBlank() && response.source == target && response.target == source && response.payload.optBoolean("ok", false)
            Channel(id, source, target, true, ok, response.correlationId, if (ok) null else "INVALID_PROBE_RESPONSE")
        }.getOrElse { error -> Channel(id, source, target, runtime.canRoute(target), false, error = error.message ?: "PROBE_FAILED") }
    }

    /** Probes the five physical N01 peer connections. The returned response also exercises the reverse message direction. */
    fun probeN01Peers(): List<Channel> = SoulMeshChannels.nuclei.filter { it != "N01" }.map { target -> probe("N01", target) }

    /** Full 60-channel certification is distributed: each remote runtime must originate its own OUT probes. */
    fun probeAll(): List<Channel> = probeN01Peers()
}
