package com.divibisoul.soul

import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/** In-process transport used by the APK; nucleus traffic does not require a local server. */
class SoulMeshRuntime(private val nuclei: List<String> = SoulMeshChannels.nuclei) {
    private val endpoints = ConcurrentHashMap<String, SoulMeshEndpoint>()

    fun register(nucleusId: String, endpoint: SoulMeshEndpoint) {
        require(nucleusId in nuclei) { "Unknown nucleus: $nucleusId" }
        endpoints[nucleusId] = endpoint
    }

    fun send(source: String, target: String, capability: String, payload: JSONObject): SoulMeshMessage {
        require(source in nuclei && target in nuclei)
        val endpoint = endpoints[target] ?: error("Nucleus $target is not registered")
        if (source == target) {
            require(SoulCapabilityCatalog.owner(capability).owner == target) {
                "Self-target dispatch requires a capability owned by target nucleus"
            }
        }
        val request = SoulMeshMessage(
            id = UUID.randomUUID().toString(),
            correlationId = UUID.randomUUID().toString(),
            source = source,
            target = target,
            kind = "request",
            capability = capability,
            payload = payload,
            timestamp = System.currentTimeMillis(),
        )
        return endpoint.receive(request)
    }

    fun registeredNuclei(): Set<String> = endpoints.keys

    fun allNucleiRegistered(): Boolean = endpoints.keys.containsAll(nuclei)
}
