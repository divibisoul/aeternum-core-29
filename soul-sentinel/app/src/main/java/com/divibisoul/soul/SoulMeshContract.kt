package com.divibisoul.soul

/** Canonical validation rules for Soul Mesh v1. */
object SoulMeshContract {
    const val PROTOCOL = "soul-mesh/1"
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
        channelId: String? = null,
    ): Result<Unit> {
        if (protocol != PROTOCOL) return Result.failure(IllegalArgumentException("Unsupported Mesh protocol"))
        if (id.isBlank() || correlationId.isBlank()) return Result.failure(IllegalArgumentException("Missing message identifiers"))
        if (source !in nucleusIds || target !in nucleusIds) return Result.failure(IllegalArgumentException("Unknown nucleus"))
        if (source == target) return Result.failure(IllegalArgumentException("Inter-nucleus message cannot target itself"))
        if (kind !in kinds) return Result.failure(IllegalArgumentException("Unknown message kind"))
        if (capability.isBlank() && kind != "event") return Result.failure(IllegalArgumentException("Missing capability"))
        if (!channelId.isNullOrBlank()) {
            val slot = Regex("^(?:$source\\.OUT\\.[1-5]\\.$target|$target\\.IN\\.[1-5]\\.$source)$")
            val legacy = Regex("^(?:$source\\.OUT\\.$target|$target\\.IN\\.$source)$")
            if (!slot.matches(channelId) && !legacy.matches(channelId)) return Result.failure(IllegalArgumentException("Invalid channel ID"))
        }
        return Result.success(Unit)
    }
}
