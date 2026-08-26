package com.divibisoul.soul

import org.json.JSONObject

/** Canonical wire envelope shared by every transport. */
object SoulMeshEnvelope {
    const val PROTOCOL = "soul-mesh/1"
    const val MAX_PAYLOAD_BYTES = 2 * 1024 * 1024

    fun encode(message: SoulMeshMessage): ByteArray {
        message.validate().getOrThrow()
        val bytes = message.toJson().toString().toByteArray(Charsets.UTF_8)
        require(bytes.size <= MAX_PAYLOAD_BYTES) { "Mesh payload exceeds limit" }
        return bytes
    }

    fun decode(bytes: ByteArray): SoulMeshMessage {
        require(bytes.size <= MAX_PAYLOAD_BYTES) { "Mesh payload exceeds limit" }
        return SoulMeshMessage.fromJson(JSONObject(String(bytes, Charsets.UTF_8)))
            .also { it.validate().getOrThrow() }
    }
}
