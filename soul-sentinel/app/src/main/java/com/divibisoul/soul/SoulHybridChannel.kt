package com.divibisoul.soul

/**
 * Logical channel for the hybrid GPU fabric. A port is stable even when its
 * physical transport changes between in-process, WebView, loopback or network.
 */
data class SoulHybridChannel(
    val source: String,
    val target: String,
    val direction: Direction,
    val slot: Int,
    val transports: List<Transport> = listOf(
        Transport.IN_PROCESS,
        Transport.WEBVIEW_BRIDGE,
        Transport.LOOPBACK_HTTP,
        Transport.REALTIME,
        Transport.HTTP,
    ),
) {
    init {
        require(source != target) { "SELF_CHANNEL_NOT_ALLOWED" }
        require(slot in 1..5) { "INVALID_CHANNEL_SLOT" }
    }

    val id: String get() = "$source->$target:${direction.name.lowercase()}:$slot"

    enum class Direction { IN, OUT }
    enum class Transport { WEBVIEW_BRIDGE, LOOPBACK_HTTP, HTTP, REALTIME, IN_PROCESS }
}

object SoulHybridTopology {
    val nuclei = listOf("N01", "N02", "N03", "N04", "N05", "N06")

    fun channels(owner: String): List<SoulHybridChannel> {
        require(owner in nuclei) { "Unknown nucleus: $owner" }
        val peers = nuclei.filterNot { it == owner }
        return peers.mapIndexed { index, peer ->
            val slot = index + 1
            listOf(
                SoulHybridChannel(owner, peer, SoulHybridChannel.Direction.OUT, slot),
                SoulHybridChannel(peer, owner, SoulHybridChannel.Direction.IN, slot),
            )
        }.flatten()
    }

    fun allChannels(): List<SoulHybridChannel> = nuclei.flatMap(::channels)
}
