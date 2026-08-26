package com.divibisoul.soul

import org.json.JSONObject
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Hybrid Soul mesh runtime.
 *
 * Physical transport is deliberately separated from the mesh protocol. A peer may
 * be reached in-process, through Android/local IPC, loopback, or a network adapter.
 * No transport is treated as connected merely because it is configured.
 */
class SoulMeshRuntime(
    private val nuclei: List<String> = SoulMeshChannels.nuclei,
    private val transports: SoulMeshTransportRegistry = SoulMeshTransportRegistry(),
) {
    private val endpoints = ConcurrentHashMap<String, SoulMeshEndpoint>()
    private val health = ConcurrentHashMap<String, MeshHealth>()

    enum class MeshHealth { UNKNOWN, HEALTHY, FAILED }

    fun register(nucleusId: String, endpoint: SoulMeshEndpoint) {
        require(nucleusId in nuclei) { "Unknown nucleus: $nucleusId" }
        require(nucleusId != "N01") { "N01 is the caller and must not self-register as a peer" }
        endpoints[nucleusId] = endpoint
        health[nucleusId] = MeshHealth.HEALTHY
    }

    fun bindTransport(nucleusId: String, transporter: SoulMeshTransporter) {
        require(nucleusId in nuclei) { "Unknown nucleus: $nucleusId" }
        require(nucleusId != "N01") { "N01 cannot bind a peer transport to itself" }
        transports.bind(nucleusId, transporter)
        health.putIfAbsent(nucleusId, MeshHealth.UNKNOWN)
    }

    fun canRoute(target: String): Boolean {
        require(target in nuclei) { "Unknown nucleus: $target" }
        return endpoints.containsKey(target) || transports.hasRoute(target)
    }

    fun send(source: String, target: String, capability: String, payload: JSONObject): SoulMeshMessage {
        require(source in nuclei && target in nuclei && source != target)
        val request = SoulMeshMessage(
            id = UUID.randomUUID().toString(),
            correlationId = UUID.randomUUID().toString(),
            source = source,
            target = target,
            kind = "request",
            capability = capability,
            payload = payload,
            timestamp = Instant.now().toString(),
        )
        try {
            endpoints[target]?.let { endpoint ->
                return acceptResponse(target, request, endpoint.receive(request))
            }
            transports.transporterFor(target)?.let { transporter ->
                return acceptResponse(target, request, transporter.send(request))
            }
        } catch (failure: Throwable) {
            health[target] = MeshHealth.FAILED
            throw failure
        }
        health[target] = MeshHealth.FAILED
        error("NO_HYBRID_ROUTE: nucleus $target has no bound endpoint or transport")
    }

    private fun acceptResponse(
        target: String,
        request: SoulMeshMessage,
        response: SoulMeshMessage,
    ): SoulMeshMessage {
        response.validate().getOrThrow()
        require(response.correlationId == request.correlationId) {
            "MESH_CORRELATION_MISMATCH"
        }
        health[target] = MeshHealth.HEALTHY
        return response
    }

    fun registeredNuclei(): Set<String> = endpoints.keys
    fun routedNuclei(): Set<String> = transports.routedNuclei()
    fun allNucleiRouted(): Boolean =
        nuclei.filter { it != "N01" }.all { canRoute(it) }

    fun health(target: String): MeshHealth = health[target] ?: MeshHealth.UNKNOWN
    fun healthSnapshot(): Map<String, MeshHealth> = health.toMap()
}
