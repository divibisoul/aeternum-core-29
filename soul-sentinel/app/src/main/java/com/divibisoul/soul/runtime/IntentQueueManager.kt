package com.divibisoul.soul.runtime

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.cancel
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

private data class PendingIntent(
    val intent: QueuedIntent,
    val sequence: Long
)

class IntentQueueManager(
    private val scope: CoroutineScope,
    private val onFailure: (QueuedIntent, Throwable) -> Unit = { _, _ -> }
) {
    private val signal = Channel<Unit>(Channel.CONFLATED)
    private val mutex = Mutex()
    private val pending = PriorityQueue<PendingIntent>(
        compareByDescending<PendingIntent> { it.intent.priority }
            .thenBy { it.sequence }
    )
    private val sequence = AtomicLong()
    private var worker: Job? = null

    fun start() {
        if (worker != null) return
        worker = scope.launch(Dispatchers.Default) {
            while (true) {
                signal.receive()
                while (true) {
                    val next = mutex.withLock { pending.poll()?.intent } ?: break
                    try {
                        next.run()
                    } catch (error: Throwable) {
                        onFailure(next, error)
                    }
                }
            }
        }
    }

    suspend fun enqueue(intent: QueuedIntent) {
        mutex.withLock {
            pending.add(PendingIntent(intent, sequence.incrementAndGet()))
        }
        signal.trySend(Unit)
    }

    suspend fun depth(): Int = mutex.withLock { pending.size }

    fun stop() {
        worker?.cancel()
        worker = null
    }
}
