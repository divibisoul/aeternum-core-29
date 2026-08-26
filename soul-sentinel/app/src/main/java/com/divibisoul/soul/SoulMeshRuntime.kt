package com.divibisoul.soul

import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/** In-process transport used by the final APK. No localhost/server is required for nucleus-to-nucleus traffic. */
class SoulMeshRuntime(private val nuclei: List<String> = SoulMeshChannels.nuclei) {
    private val endpoints = ConcurrentHashMap<String, SoulMeshEndpoint>()

    fun register(nucleusId: String, endpoint: SoulMeshEndpoint) {
        require(nucleusId in nuclei) { "Unknown nucleus: $nucleusId" }
        endpoints[nucleusId] = endpoint
    }

    fun send(source: String, target: String, capability: String, payload: String): SoulMeshMessage {
        require(source in nuclei && target in nuclei && source != target)
        val endpoint = endpoints[target] ?: error("Nucleus $target is not registered")
        val request = SoulMeshMessage.request(
            id = UUID.randomUUID().toString(),
            correlationId = UUID.randomUUID().toString(),
            source = source,
            target = target,
            capability = capability,
            payload = payload,
        )
        return endpoint.receive(request)
    }

    fun registeredNuclei(): Set<String> = endpoints.keys
}
