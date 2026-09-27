package com.divibisoul.soul.runtime

import android.content.Context
import com.divibisoul.soul.core.SoulEventBus
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

object SoulAdminPlusRuntimeRegistry {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    @Volatile
    private var runtime: SoulAdminPlusRuntime? = null

    @Synchronized
    fun get(context: Context, bus: SoulEventBus): SoulAdminPlusRuntime {
        return runtime ?: SoulAdminPlusRuntime(
            context = context.applicationContext,
            bus = bus,
            scope = scope
        ).also { runtime = it }
    }
}
