package com.divibisoul.soul

/** Runtime endpoint: validates and dispatches incoming Mesh requests. */
class SoulMeshEndpoint(
    private val nucleusId: String,
    private val handlers: Map<String, (String) -> String>,
) {
    fun receive(message: SoulMeshMessage): SoulMeshMessage {
        SoulMeshContract.validate(
            protocol = message.protocol,
            id = message.id,
            correlationId = message.correlationId,
            source = message.source,
            target = message.target,
            kind = message.kind,
            capability = message.capability,
        ).getOrThrow()
        require(message.target == nucleusId) { "Message target does not match endpoint" }
        if (message.kind != "request") return message
        val handler = handlers[message.capability]
            ?: return SoulMeshMessage.error(message, "CAPABILITY_NOT_FOUND", "No local handler")
        return try {
            SoulMeshMessage.response(message, handler(message.payload))
        } catch (t: Throwable) {
            SoulMeshMessage.error(message, "CAPABILITY_EXECUTION_ERROR", t.message ?: "Unknown error")
        }
    }
}
