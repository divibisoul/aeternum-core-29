package com.divibisoul.soul

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder

class SoulAdminService : Service() {
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
        // Única inicialização do ciclo administrativo.
        // A execução continua pertencendo ao serviço; onStartCommand não cria outro ciclo.
        kotlinx.coroutines.CoroutineScope(
            kotlinx.coroutines.SupervisorJob() + kotlinx.coroutines.Dispatchers.Default
        ).launch {
            while (kotlinx.coroutines.isActive) {
                runCycle()
                kotlinx.coroutines.delay(config.checkIntervalMs)
            }
        }
    }

    private fun runCycle() {
        cortex.evaluate().forEach { decision ->
            android.util.Log.i("SoulAdmin", "${decision.action}: ${decision.reason}")
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
        // O runtime/ciclo já foi iniciado em onCreate.
        return START_STICKY
    }

    override fun onDestroy() {
        // O escopo é encerrado pelo próprio processo do serviço quando destruído.
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val CHANNEL = "soul_admin"
        const val NOTIFICATION_ID = 7001
    }
}
