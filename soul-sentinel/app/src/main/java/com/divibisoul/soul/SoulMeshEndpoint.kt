package com.divibisoul.soul

import org.json.JSONObject

/** Runtime endpoint: validates, dispatches local capabilities, and delegates hybrid execution. */
class SoulMeshEndpoint(
    private val nucleusId: String,
    private val handlers: Map<String, (JSONObject) -> JSONObject>,
    private val fallback: ((SoulMeshMessage) -> SoulMeshMessage)? = null,
) {
    fun receive(message: SoulMeshMessage): SoulMeshMessage {
        message.validate().getOrThrow()
        require(message.target == nucleusId) { "Message target does not match endpoint" }
        if (message.kind != "request") return message

        if (message.capability == "mesh.ping") {
            return reply(message, "response", JSONObject().put("ok", true).put("nucleus", nucleusId))
        }

        handlers[message.capability]?.let { handler ->
            return try {
                reply(message, "response", handler(message.payload))
            } catch (t: Throwable) {
                reply(message, "error", JSONObject().put("code", "CAPABILITY_EXECUTION_ERROR").put("detail", t.message ?: "Unknown capability error"))
            }
        }

        fallback?.let { return it(message) }
        return reply(message, "error", JSONObject().put("code", "CAPABILITY_NOT_FOUND").put("capability", message.capability))
    }

    private fun reply(source: SoulMeshMessage, kind: String, payload: JSONObject): SoulMeshMessage =
        SoulMeshMessage(
            id = java.util.UUID.randomUUID().toString(),
            correlationId = source.correlationId,
            source = source.target,
            target = source.source,
            kind = kind,
            capability = source.capability,
            payload = payload,
            timestamp = System.currentTimeMillis(),
        )
}
