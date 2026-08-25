package com.divibisoul.soul.core

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

class SoulEventBus {
    private val _events = MutableSharedFlow<SoulEvent>(extraBufferCapacity = 128)
    val events: SharedFlow<SoulEvent> = _events.asSharedFlow()

    fun publish(event: SoulEvent) {
        _events.tryEmit(event)
    }
}
