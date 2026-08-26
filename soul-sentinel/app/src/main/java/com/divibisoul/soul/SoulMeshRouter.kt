package com.divibisoul.soul

import org.json.JSONObject

/** Routes requests through the hybrid transport and prevents capability misrouting. */
class SoulMeshRouter(
    private val nucleusId: String,
    private val transport: SoulMeshTransporter,
) {
    fun request(target: String, capability: String, payload: JSONObject): SoulMeshMessage {
        require(target != nucleusId) { "Self-routing is forbidden" }
        require(target in SoulMeshChannels.nuclei) { "Unknown nucleus: $target" }
        if (capability != "mesh.ping") {
            require(SoulCapabilityCatalog.owner(capability).owner == target) { "Capability $capability belongs to ${SoulCapabilityCatalog.owner(capability).owner}, not $target" }
        }
        val request = SoulMeshMessage(
            id = java.util.UUID.randomUUID().toString(),
            correlationId = java.util.UUID.randomUUID().toString(),
            source = nucleusId,
            target = target,
            kind = "request",
            capability = capability,
            payload = payload,
            timestamp = java.time.Instant.now().toString(),
        )
        return transport.send(request)
    }
}
