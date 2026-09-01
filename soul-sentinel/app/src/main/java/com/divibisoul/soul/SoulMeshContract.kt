package com.divibisoul.soul

/** Canonical validation rules for Soul Mesh v1. */
object SoulMeshContract {
    const val PROTOCOL = "soul-mesh/1"
    const val CONTRACT_VERSION = "1.1.0"

    val nucleusIds = setOf("N01", "N02", "N03", "N04", "N05", "N06")
    val kinds = setOf("request", "response", "event", "error")

    fun validate(
        protocol: String,
        contractVersion: String,
        id: String,
        correlationId: String,
        source: String,
        target: String,
        kind: String,
        capability: String,
    ): Result<Unit> {
        if (protocol != PROTOCOL) return Result.failure(IllegalArgumentException("Unsupported Mesh protocol"))
        if (contractVersion != CONTRACT_VERSION) return Result.failure(IllegalArgumentException("Unsupported Mesh contract version"))
        if (id.isBlank() || correlationId.isBlank()) return Result.failure(IllegalArgumentException("Missing message identifiers"))
        if (source !in nucleusIds || target !in nucleusIds) return Result.failure(IllegalArgumentException("Unknown nucleus"))
        if (source == target) return Result.failure(IllegalArgumentException("Inter-nucleus message cannot target itself"))
        if (kind !in kinds) return Result.failure(IllegalArgumentException("Unknown message kind"))
        if (capability.isBlank() && kind != "event") return Result.failure(IllegalArgumentException("Missing capability"))
        return Result.success(Unit)
    }
}
