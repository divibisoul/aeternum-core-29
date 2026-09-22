package com.divibisoul.soul.runtime

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.util.PriorityQueue
import java.util.concurrent.atomic.AtomicLong

data class QueuedIntent(
    val id: String,
    val priority: Int,
    val run: suspend () -> Unit
)

class IntentQueueManager(private val scope: CoroutineScope) {
    private val channel = Channel<QueuedIntent>(Channel.UNLIMITED)
    private val mutex = Mutex()
    private val pending = PriorityQueue<QueuedIntent>(
        compareByDescending<QueuedIntent> { it.priority }
    )
    private val sequence = AtomicLong()
    private var worker: Job? = null

    fun start() {
        if (worker != null) return
        worker = scope.launch(Dispatchers.Default) {
            for (incoming in channel) {
                mutex.withLock {
                    pending.add(incoming.copy(id = incoming.id + "-" + sequence.incrementAndGet()))
                }
                drain()
            }
        }
    }

    suspend fun enqueue(intent: QueuedIntent) = channel.send(intent)

    suspend fun depth(): Int = mutex.withLock { pending.size }

    private suspend fun drain() {
        while (true) {
            val next = mutex.withLock { pending.poll() } ?: break
            runCatching { next.run() }
        }
    }

    fun stop() {
        worker?.cancel()
        worker = null
    }
}
