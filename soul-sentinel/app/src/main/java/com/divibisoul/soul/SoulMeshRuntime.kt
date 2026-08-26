package com.divibisoul.soul

import org.json.JSONObject
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/** In-process N01 endpoint registry with optional transport for real remote nuclei. */
class SoulMeshRuntime(
    private val nuclei: List<String> = SoulMeshChannels.nuclei,
    private val remote: SoulMeshTransport? = null,
) {
    private val endpoints = ConcurrentHashMap<String, SoulMeshEndpoint>()

    fun register(nucleusId: String, endpoint: SoulMeshEndpoint) {
        require(nucleusId in nuclei) { "Unknown nucleus: $nucleusId" }
        endpoints[nucleusId] = endpoint
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
        endpoints[target]?.let { return it.receive(request) }
        return remote?.send(request) ?: error("Nucleus $target is not registered and no remote transport is configured")
    }

    fun registeredNuclei(): Set<String> = endpoints.keys

    fun allNucleiRegistered(): Boolean = endpoints.keys.containsAll(nuclei)
}
