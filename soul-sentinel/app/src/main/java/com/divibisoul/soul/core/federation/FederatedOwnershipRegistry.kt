package com.divibisoul.soul.core.federation

enum class FederationNode(val id: String, val role: String) {
    N01("N01", "Android + Mesh"),
    N02("N02", "Conversation + provider"),
    N03("N03", "Perception + audio"),
    N04("N04", "Chat + tools + documents"),
    N05("N05", "Inference + conversation"),
    N06("N06", "Cognitive"),
    N07("N07", "Orchestration + federation + compute"),
    SARA("SARA", "Regeneration + audit + ethics + strategy + memory + rollback + provenance + governance")
}

data class CapabilityRoute(
    val capabilityFamily: String,
    val owner: FederationNode,
    val executionBoundary: String,
    val status: Status = Status.UNKNOWN
) {
    enum class Status { UNKNOWN, CONFIGURED, ONLINE, OFFLINE, DISABLED, BLOCKED }
}

object FederatedOwnershipRegistry {
    val routes = listOf(
        CapabilityRoute("android.*", FederationNode.N01, "Soul Mesh / Android boundary"),
        CapabilityRoute("mesh.*", FederationNode.N01, "Soul Mesh"),
        CapabilityRoute("conversation.*", FederationNode.N02, "N07 federation"),
        CapabilityRoute("perception.*", FederationNode.N03, "N07 federation"),
        CapabilityRoute("document.*", FederationNode.N04, "N07 federation"),
        CapabilityRoute("inference.*", FederationNode.N05, "N07 federation"),
        CapabilityRoute("cognitive.*", FederationNode.N06, "N07 federation"),
        CapabilityRoute("orchestration.*", FederationNode.N07, "N07 HTTPS API"),
        CapabilityRoute("sara.*", FederationNode.SARA, "SARA HTTP API via N07 or configured service")
    )
}
