package com.divibisoul.soul

/** Symmetric peer/channel registry. N01 keeps its Android/local transports; this registry gives them one peer model. */
object SoulMeshPeerRegistry {
    val peers = listOf("N02", "N03", "N04", "N05", "N06")
    val inboundChannels = peers.associateWith { "N01.IN.$it" }
    val outboundChannels = peers.associateWith { "N01.OUT.$it" }
    fun channelFor(target: String): String? = outboundChannels[target]
}
