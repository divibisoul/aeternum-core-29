package com.divibisoul.soul

import org.json.JSONObject

/** Canonical validation rules for Soul Mesh v1. */
object SoulMeshContract {
    const val PROTOCOL = "soul-mesh/1"
    const val MAX_PAYLOAD_BYTES = 2 * 1024 * 1024
    const val MAX_CLOCK_SKEW_MS = 5 * 60 * 1000L

    val nucleusIds = setOf("N01", "N02", "N03", "N04", "N05", "N06")
    val kinds = setOf("request", "response", "event", "error", "ack")

    fun validate(
        protocol: String,
        id: String,
        correlationId: String,
        source: String,
        target: String,
        kind: String,
        capability: String,
        payload: JSONObject,
        timestamp: Long,
    ): Result<Unit> {
        if (protocol != PROTOCOL) return Result.failure(IllegalArgumentException("Unsupported Mesh protocol"))
        if (id.isBlank() || correlationId.isBlank()) return Result.failure(IllegalArgumentException("Missing message identifiers"))
        if (source !in nucleusIds || target !in nucleusIds) return Result.failure(IllegalArgumentException("Unknown nucleus"))
        if (source == target) return Result.failure(IllegalArgumentException("Inter-nucleus message cannot target itself"))
        if (kind !in kinds) return Result.failure(IllegalArgumentException("Unknown message kind"))
        if (capability.isBlank() && kind != "event") return Result.failure(IllegalArgumentException("Missing capability"))
        if (timestamp <= 0L) return Result.failure(IllegalArgumentException("Invalid timestamp"))
        if (kotlin.math.abs(System.currentTimeMillis() - timestamp) > MAX_CLOCK_SKEW_MS) {
            return Result.failure(IllegalArgumentException("Mesh message timestamp outside accepted clock skew"))
        }
        if (payload.toString().toByteArray(Charsets.UTF_8).size > MAX_PAYLOAD_BYTES) {
            return Result.failure(IllegalArgumentException("Mesh payload exceeds maximum size"))
        }
        return Result.success(Unit)
    }
}
