package com.divibisoul.soul

import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

/** Transport-independent request/response correlation layer. */
class SoulMeshRpc(
    private val send: (SoulMeshMessage) -> Unit,
    private val timeoutMs: Long = 10_000L,
) {
    private val pending = ConcurrentHashMap<String, Long>()

    fun request(source: String, target: String, capability: String, payload: String): String {
        val id = UUID.randomUUID().toString()
        val correlationId = id
        pending[correlationId] = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(timeoutMs)
        send(SoulMeshMessage.request(id, correlationId, source, target, capability, payload))
        return correlationId
    }

    fun acceptResponse(message: SoulMeshMessage): Boolean {
        val deadline = pending.remove(message.correlationId) ?: return false
        if (System.nanoTime() > deadline) return false
        return message.kind == "ack" || message.kind == "response" || message.kind == "error"
    }

    fun expire(): List<String> {
        val now = System.nanoTime()
        return pending.entries.filter { it.value <= now }.mapNotNull { entry ->
            if (pending.remove(entry.key, entry.value)) entry.key else null
        }
    }
}
