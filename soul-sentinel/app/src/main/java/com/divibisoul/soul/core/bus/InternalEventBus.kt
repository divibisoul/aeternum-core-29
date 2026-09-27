package com.divibisoul.soul.core.bus

import com.divibisoul.soul.core.SoulEvent
import com.divibisoul.soul.core.SoulEventBus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.filterIsInstance

class InternalEventBus(private val soulBus: SoulEventBus) {
    val events: SharedFlow<SoulEvent> = soulBus.events
    fun publish(event: SoulEvent) = soulBus.publish(event)
    inline fun <reified T : SoulEvent> stream(): Flow<T> =
        events.filterIsInstance<T>()
}
