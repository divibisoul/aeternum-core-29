package com.divibisoul.soul

import org.json.JSONObject
import java.util.UUID

/** Routes requests through the hybrid transport and prevents capability misrouting. */
class SoulMeshRouter(
    private val nucleusId: String,
    private val transport: SoulMeshTransporter,
) {
    fun request(target: String, capability: String, payload: JSONObject): SoulMeshMessage {
        require(target != nucleusId) { "Self-routing is forbidden" }
        // N07 remains routable as a structural/control-plane participant without being
        // counted as one of the six operational AI nuclei or the 60 AI channel surfaces.
        require(target in SoulMeshContract.nucleusIds) { "Unknown Mesh participant: $target" }
        if (capability != "mesh.ping") {
            require(SoulCapabilityCatalog.owner(capability).owner == target) {
                "Capability $capability belongs to ${SoulCapabilityCatalog.owner(capability).owner}, not $target"
            }
        }
        val request = SoulMeshMessage(
            id = UUID.randomUUID().toString(),
            correlationId = UUID.randomUUID().toString(),
            source = nucleusId,
            target = target,
            kind = "request",
            capability = capability,
            payload = payload,
            timestamp = System.currentTimeMillis(),
        )
        return transport.send(request)
    }
}
