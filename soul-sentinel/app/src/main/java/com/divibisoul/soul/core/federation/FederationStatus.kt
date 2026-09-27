package com.divibisoul.soul.core.federation

enum class BoundaryStatus {
    LOCAL,
    REMOTE_VIA_N07,
    CONFIGURED,
    DISABLED,
    UNKNOWN,
    BLOCKED
}

data class FederationMemberStatus(
    val node: FederationNode,
    val status: BoundaryStatus,
    val authority: String
)

object FederationStatusMatrix {
    fun initial(): List<FederationMemberStatus> = listOf(
        FederationMemberStatus(FederationNode.N01, BoundaryStatus.LOCAL, "Android + Mesh"),
        FederationMemberStatus(FederationNode.N02, BoundaryStatus.REMOTE_VIA_N07, "Conversation + provider"),
        FederationMemberStatus(FederationNode.N03, BoundaryStatus.REMOTE_VIA_N07, "Perception + audio"),
        FederationMemberStatus(FederationNode.N04, BoundaryStatus.REMOTE_VIA_N07, "Chat + tools + documents"),
        FederationMemberStatus(FederationNode.N05, BoundaryStatus.REMOTE_VIA_N07, "Inference + conversation"),
        FederationMemberStatus(FederationNode.N06, BoundaryStatus.REMOTE_VIA_N07, "Cognitive"),
        FederationMemberStatus(FederationNode.N07, BoundaryStatus.UNKNOWN, "Orchestration + federation + compute"),
        FederationMemberStatus(FederationNode.SARA, BoundaryStatus.UNKNOWN, "Regeneration + audit + governance")
    )
}
