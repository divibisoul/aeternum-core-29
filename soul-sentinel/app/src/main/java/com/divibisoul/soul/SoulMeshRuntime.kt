package com.divibisoul.soul

import org.json.JSONObject
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/** Hybrid in-process mesh runtime. Local nuclei are preferred; remote nuclei use the configured transporter. */
class SoulMeshRuntime(
    private val nuclei: List<String> = SoulMeshChannels.nuclei,
    private val remote: SoulMeshTransporter? = null,
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

    fun canRoute(target: String): Boolean {
        require(target in nuclei) { "Unknown nucleus: $target" }
        return endpoints.containsKey(target) || remote != null
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
            endpoints[target]?.let {
                val response = it.receive(request)
                response.validate().getOrThrow()
                require(response.correlationId == request.correlationId) { "MESH_CORRELATION_MISMATCH" }
                health[target] = MeshHealth.HEALTHY
                return response
            }
            remote?.let {
                val response = it.send(request)
                response.validate().getOrThrow()
                require(response.correlationId == request.correlationId) { "MESH_CORRELATION_MISMATCH" }
                health[target] = MeshHealth.HEALTHY
                return response
            }
        } catch (failure: Throwable) {
            health[target] = MeshHealth.FAILED
            throw failure
        }
        health[target] = MeshHealth.FAILED
        error("NO_HYBRID_ROUTE: nucleus $target is neither locally registered nor remotely configured")
    }

    fun registeredNuclei(): Set<String> = endpoints.keys
    fun allNucleiRegistered(): Boolean = endpoints.keys.containsAll(nuclei.filter { it != "N01" })
    fun health(target: String): MeshHealth = health[target] ?: MeshHealth.UNKNOWN
    fun healthSnapshot(): Map<String, MeshHealth> = health.toMap()
}
