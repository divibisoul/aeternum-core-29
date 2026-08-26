package com.divibisoul.soul

/** Transport multiplexer for the hybrid APK. Local modules stay in-process; server-backed capabilities use HTTP. */
class SoulHybridTransport(
    private val local: Map<String, (SoulMeshMessage) -> SoulMeshMessage>,
    private val remote: SoulMeshTransport,
) {
    fun send(message: SoulMeshMessage): SoulMeshMessage {
        message.validate().getOrThrow()
        local[message.target]?.let { return it(message) }
        return remote.send(message)
    }
}
