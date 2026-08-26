package com.divibisoul.soul

import org.json.JSONObject

/** Routes local requests to the concrete transport and rejects unknown peers. */
class SoulMeshRouter(
    private val nucleusId: String,
    private val transport: SoulMeshTransport,
) {
    fun request(target: String, capability: String, payload: JSONObject): SoulMeshMessage {
        require(target != nucleusId) { "Self-routing is forbidden" }
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
