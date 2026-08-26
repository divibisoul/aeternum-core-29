package com.divibisoul.soul

import org.json.JSONObject

/** Routes requests through the hybrid transport: in-process first, HTTP only for remote services. */
class SoulMeshRouter(
    private val nucleusId: String,
    private val transport: SoulMeshTransporter,
) {
    fun request(target: String, capability: String, payload: JSONObject): SoulMeshMessage {
        require(target != nucleusId) { "Self-routing is forbidden" }
        require(target in SoulMeshChannels.nuclei) { "Unknown nucleus: $target" }
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
