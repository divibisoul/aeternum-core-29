package com.divibisoul.soul

import org.json.JSONObject
import java.util.UUID

/** Outbound RPC client from N01 to an independently deployed nucleus. */
class SoulMeshRemoteClient(private val sourceNucleus: String = "N01") {
    fun request(target: String, capability: String, payload: JSONObject): Result<SoulMeshMessage> {
        require(sourceNucleus == "N01") { "This client is reserved for N01" }
        require(target in SoulMeshContract.nucleusIds && target != sourceNucleus) { "Invalid Mesh target: $target" }
        require(capability.isNotBlank()) { "Capability must not be blank" }

        val endpoint = SoulMeshPeerConfig.endpointFor(target)
            ?: return Result.failure(IllegalStateException("No deployed endpoint configured for $target"))

        val request = SoulMeshMessage(
            id = UUID.randomUUID().toString(),
            correlationId = UUID.randomUUID().toString(),
            source = sourceNucleus,
            target = target,
            kind = "request",
            capability = capability,
            payload = payload,
            timestamp = System.currentTimeMillis(),
        )
        return SoulMeshTransport(mapOf(target to endpoint)).send(request)
    }

    fun pingN02(): Result<SoulMeshMessage> = request("N02", "mesh.ping", JSONObject())
}
