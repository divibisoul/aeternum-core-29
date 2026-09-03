package com.divibisoul.soul

/** Canonical validation rules for Soul Mesh v1 across all seven independent nuclei. */
object SoulMeshContract {
    const val PROTOCOL = "soul-mesh/1"
    const val CONTRACT_VERSION = "1.1.0"
    private const val MAX_ID_LENGTH = 200
    private const val MAX_CAPABILITY_LENGTH = 200
    private const val MAX_CLOCK_SKEW_MS = 5 * 60 * 1000L

    val nucleusIds = setOf("N01", "N02", "N03", "N04", "N05", "N06", "N07")
    val kinds = setOf("request", "response", "event", "error", "ack")

    fun validate(
        protocol: String,
        contractVersion: String,
        id: String,
        correlationId: String,
        source: String,
        target: String,
        kind: String,
        capability: String,
        timestamp: Long = System.currentTimeMillis(),
    ): Result<Unit> {
        if (protocol != PROTOCOL) return Result.failure(IllegalArgumentException("Unsupported Mesh protocol"))
        if (contractVersion != CONTRACT_VERSION) return Result.failure(IllegalArgumentException("Unsupported Mesh contract version"))
        if (id.isBlank() || id.length > MAX_ID_LENGTH || correlationId.isBlank() || correlationId.length > MAX_ID_LENGTH) return Result.failure(IllegalArgumentException("Invalid message identifiers"))
        if (source !in nucleusIds || target !in nucleusIds || source == target) return Result.failure(IllegalArgumentException("Invalid nucleus route"))
        if (kind !in kinds) return Result.failure(IllegalArgumentException("Unknown message kind"))
        if (capability.isBlank() && kind != "event" && kind != "ack") return Result.failure(IllegalArgumentException("Missing capability"))
        if (capability.length > MAX_CAPABILITY_LENGTH) return Result.failure(IllegalArgumentException("Capability too long"))
        if (timestamp <= 0L || kotlin.math.abs(System.currentTimeMillis() - timestamp) > MAX_CLOCK_SKEW_MS) return Result.failure(IllegalArgumentException("Invalid message timestamp"))
        return Result.success(Unit)
    }
}
