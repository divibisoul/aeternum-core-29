package com.divibisoul.soul

import org.json.JSONObject
import java.util.UUID

/** Transport-agnostic outbound RPC facade. N01 remains the owner of local capabilities. */
class SoulMeshRemoteClient(private val sourceNucleus: String = "N01") {
    companion object {
        private const val CAPABILITY_FUSION_DESCRIBE = "mesh.fusion.describe"
        private const val CAPABILITY_LIST = "mesh.capabilities"
    }

    fun request(target: String, capability: String, payload: JSONObject): Result<SoulMeshMessage> = runCatching {
        require(sourceNucleus in SoulMeshContract.nucleusIds) { "Invalid source nucleus" }
        require(target in SoulMeshContract.nucleusIds && target != sourceNucleus) { "Invalid Mesh target: $target" }
        require(capability.isNotBlank()) { "Capability must not be blank" }
        val endpoint = SoulMeshPeerConfig.endpointFor(target) ?: error("No deployed endpoint configured for $target")
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
        SoulMeshTransport(mapOf(target to endpoint)).send(request)
    }

    fun ping(target: String): Result<SoulMeshMessage> = request(target, "mesh.ping", JSONObject())
    fun pingN02(): Result<SoulMeshMessage> = ping("N02")
    fun describe(target: String): Result<SoulMeshMessage> = request(target, CAPABILITY_FUSION_DESCRIBE, JSONObject())
    fun listCapabilities(target: String): Result<SoulMeshMessage> = request(target, CAPABILITY_LIST, JSONObject())
}
