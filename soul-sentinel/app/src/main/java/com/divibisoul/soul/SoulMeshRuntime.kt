package com.divibisoul.soul

import org.json.JSONObject
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Hybrid in-process mesh runtime. Local nuclei are preferred; when a nucleus
 * is not hosted by the APK, the same message is handed to a configured hybrid
 * transporter. The runtime never converts an unavailable route into success.
 */
class SoulMeshRuntime(
    private val nuclei: List<String> = SoulMeshChannels.nuclei,
    private val remote: SoulMeshTransporter? = null,
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
        remote?.let { return it.send(request) }
        error("NO_HYBRID_ROUTE: nucleus $target is neither locally registered nor remotely configured")
    }

    fun registeredNuclei(): Set<String> = endpoints.keys

    fun allNucleiRegistered(): Boolean = endpoints.keys.containsAll(nuclei)
}
