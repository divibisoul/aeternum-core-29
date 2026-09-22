package com.divibisoul.soul

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.ComponentCallbacks2
import android.os.IBinder
import android.util.Log
import com.divibisoul.soul.runtime.SoulAdminPlusRuntime
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class SoulAdminService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private lateinit var config: SoulConfig
    private lateinit var cortex: SoulCortex
    private lateinit var actions: SoulActions
    private lateinit var plus: SoulAdminPlusRuntime

    override fun onCreate() {
        super.onCreate()
        config = SoulConfig(this)
        cortex = SoulCortex(this, config)
        actions = SoulActions(this)
        createChannel()
        startForeground(NOTIFICATION_ID, notification("Soul Admin active — observing Android"))

        plus = com.divibisoul.soul.runtime.SoulAdminPlusRuntimeRegistry.get(
            context = this,
            bus = SoulRuntimeBusHolder.bus ?: SoulRuntimeBusHolder.create()
        )
        plus.start()
        plus.watchdog().let(::registerComponentCallbacks)

        scope.launch {
            while (isActive) {
                val reduced = plus.watchdog().isLoadReduced()
                if (!reduced) runCycle()
                delay(if (reduced) 60_000L else config.checkIntervalMs)
            }
        }
    }

    private fun runCycle() {
        cortex.evaluate().forEach { decision ->
            Log.i("SoulAdmin", "${decision.action}: ${decision.reason}")
        }
    }

    private fun createChannel() {
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(
                CHANNEL,
                "Soul Admin",
                NotificationManager.IMPORTANCE_LOW
            )
        )
    }

    private fun notification(text: String): Notification =
        Notification.Builder(this, CHANNEL)
            .setContentTitle("Soul Admin")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_manage)
            .setOngoing(true)
            .build()

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

    override fun onDestroy() {
        plus.watchdog().let { unregisterComponentCallbacks(it) }
        plus.stop()
        scope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val CHANNEL = "soul_admin"
        const val NOTIFICATION_ID = 7001
    }
}

object SoulRuntimeBusHolder {
    @Volatile
    var bus: com.divibisoul.soul.core.SoulEventBus? = null
        private set

    @Synchronized
    fun create(): com.divibisoul.soul.core.SoulEventBus {
        return bus ?: com.divibisoul.soul.core.SoulEventBus().also { bus = it }
    }
}
