package com.divibisoul.soul

import org.json.JSONObject

/** One logical Mesh API with pluggable transports. Local transports can be added without changing RPC semantics. */
interface SoulMeshChannel {
    fun send(message: SoulMeshMessage): Result<SoulMeshMessage>
}

class SoulMeshHybridTransport(
    private val remote: SoulMeshTransport,
    private val local: SoulMeshChannel? = null,
) : SoulMeshTransporter {
    override fun send(message: SoulMeshMessage): SoulMeshMessage {
        return if (message.target == message.source && local != null) {
            local.send(message).getOrThrow()
        } else {
            remote.send(message)
        }
    }

    fun request(target: String, capability: String, payload: JSONObject): Result<SoulMeshMessage> =
        runCatching {
            SoulMeshRemoteClient().request(target, capability, payload).getOrThrow()
        }
}
