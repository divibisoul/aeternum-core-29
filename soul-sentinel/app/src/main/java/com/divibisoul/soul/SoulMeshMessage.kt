package com.divibisoul.soul

import org.json.JSONObject

/** Canonical wire message for Soul Mesh v1. */
data class SoulMeshMessage(
    val protocol: String = SoulMeshContract.PROTOCOL,
    val id: String,
    val correlationId: String,
    val source: String,
    val target: String,
    val kind: String,
    val capability: String,
    val payload: JSONObject,
    val timestamp: String,
) {
    fun validate(): Result<Unit> = SoulMeshContract.validate(
        protocol, id, correlationId, source, target, kind, capability
    )

    fun toJson(): JSONObject = JSONObject().apply {
        put("protocol", protocol)
        put("id", id)
        put("correlationId", correlationId)
        put("source", source)
        put("target", target)
        put("kind", kind)
        put("capability", capability)
        put("payload", payload)
        put("timestamp", timestamp)
    }

    companion object {
        fun fromJson(json: JSONObject): SoulMeshMessage {
            val message = SoulMeshMessage(
                protocol = json.optString("protocol"),
                id = json.optString("id"),
                correlationId = json.optString("correlationId"),
                source = json.optString("source"),
                target = json.optString("target"),
                kind = json.optString("kind"),
                capability = json.optString("capability"),
                payload = json.optJSONObject("payload") ?: JSONObject(),
                timestamp = json.optString("timestamp"),
            )
            message.validate().getOrThrow()
            return message
        }
    }
}
