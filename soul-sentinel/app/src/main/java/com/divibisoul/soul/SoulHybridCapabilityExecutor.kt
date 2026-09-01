package com.divibisoul.soul

import org.json.JSONObject
import java.util.UUID

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
        "mesh.ping" -> response(message, JSONObject().put("ok", true).put("runtime", "android"))
        else -> error(message, "LOCAL_CAPABILITY_NOT_IMPLEMENTED", capability)
    }

    private fun response(source: SoulMeshMessage, payload: JSONObject) = source.copy(
        id = UUID.randomUUID().toString(), source = source.target, target = source.source,
        kind = "response", payload = payload, timestamp = System.currentTimeMillis()
    )

    private fun error(source: SoulMeshMessage, code: String, detail: String) = source.copy(
        id = UUID.randomUUID().toString(), source = source.target, target = source.source,
        kind = "error", payload = JSONObject().put("code", code).put("detail", detail),
        timestamp = System.currentTimeMillis()
    )
}
