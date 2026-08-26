package com.divibisoul.soul

/** Multiplexes in-process nucleus routing and server-backed HTTP routing. */
class SoulHybridTransport(
    private val local: Map<String, (SoulMeshMessage) -> SoulMeshMessage>,
    private val remote: SoulMeshTransport,
) : SoulMeshTransporter {
    override fun send(message: SoulMeshMessage): SoulMeshMessage {
        message.validate().getOrThrow()
        local[message.target]?.let { return it(message) }
        return remote.send(message)
    }
}
