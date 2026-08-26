package com.divibisoul.soul

import org.json.JSONObject

/** Executes a capability in the runtime that actually owns it. */
class SoulHybridCapabilityExecutor(
    private val webDelegate: (SoulMeshMessage) -> SoulMeshMessage,
    private val remoteTransport: SoulMeshTransport,
) {
    fun execute(message: SoulMeshMessage): SoulMeshMessage {
        val capability = SoulCapabilityCatalog.owner(message.capability)
        return when (capability.execution) {
            Execution.LOCAL -> local(message, capability.id)
            Execution.WEB_SESSION -> webDelegate(message)
            Execution.REMOTE_SERVICE -> remoteTransport.send(message)
        }
    }

    private fun local(message: SoulMeshMessage, capability: String): SoulMeshMessage = when (capability) {
        "mesh.ping" -> SoulMeshMessage.response(message, JSONObject().put("ok", true).put("runtime", "android"))
        else -> SoulMeshMessage.error(message, "LOCAL_CAPABILITY_NOT_IMPLEMENTED", capability)
    }
}
