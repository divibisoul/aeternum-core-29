package com.divibisoul.soul

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
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

    override fun onCreate() {
        super.onCreate()
        config = SoulConfig(this)
        cortex = SoulCortex(this, config)
        actions = SoulActions(this)
        createChannel()
        startForeground(NOTIFICATION_ID, notification("Soul Admin active — observing Android"))

        scope.launch {
            while (isActive) {
                runCycle()
                delay(config.checkIntervalMs)
            }
        }
    }

    private fun runCycle() {
        cortex.evaluate().forEach { decision ->
            Log.i("SoulAdmin", "${decision.action}: ${decision.reason}")
            // Android moderno impede várias alterações administrativas silenciosas.
            // O Cortex registra a decisão; a camada de ações trata apenas capacidades permitidas.
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

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // O ciclo já foi iniciado em onCreate. Não criar um segundo loop aqui.
        return START_STICKY
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val CHANNEL = "soul_admin"
        const val NOTIFICATION_ID = 7001
    }
}
