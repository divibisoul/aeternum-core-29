package com.divibisoul.soul

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/** Soul Sentinel watchdog: observes N01 integrity, records metrics and self-recovers the monitor on faults. */
class SoulAdminService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val mainHandler = Handler(Looper.getMainLooper())
    private lateinit var config: SoulConfig
    private lateinit var cortex: SoulCortex
    private var consecutiveFailures = 0
    private var restartScheduled = false

    override fun onCreate() {
        super.onCreate()
        config = SoulConfig(this)
        cortex = SoulCortex(this, config)
        createChannel()
        startForeground(NOTIFICATION_ID, notification("Soul Sentinel active — integrity watchdog"))
        scope.launch {
            while (isActive) {
                runCycle()
                delay(config.checkIntervalMs)
            }
        }
    }

    private fun runCycle() {
        try {
            val integrity = cortex.integritySnapshot()
            Log.i(TAG, "integrity core=${integrity.coreHealthy} mesh=${integrity.meshHealthy} battery=${integrity.batteryPercent}% nuclei=${integrity.nuclei} directedLinks=${integrity.directedLinks} pairs=${integrity.bidirectionalPairs} wifi=${integrity.wifiEnabled} bluetooth=${integrity.bluetoothEnabled}")
            cortex.evaluate().forEach { decision -> Log.i(TAG, "decision=${decision.action}: ${decision.reason}") }
            val status = if (integrity.coreHealthy && integrity.meshHealthy) "HEALTHY" else "DEGRADED"
            mainHandler.post { updateNotification("Soul Sentinel $status · ${integrity.directedLinks} directed links") }
            consecutiveFailures = 0
        } catch (error: Throwable) {
            consecutiveFailures += 1
            Log.e(TAG, "Sentinel cycle failed (#$consecutiveFailures)", error)
            updateNotification("Soul Sentinel DEGRADED · watchdog failure #$consecutiveFailures")
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) scheduleSelfRestart()
        }
    }

    private fun scheduleSelfRestart() {
        if (restartScheduled || !config.enabled) return
        restartScheduled = true
        Log.e(TAG, "Sentinel watchdog scheduling bounded service restart")
        mainHandler.postDelayed({
            try {
                stopService(Intent(this, SoulAdminService::class.java))
                ContextCompat.startForegroundService(this, Intent(this, SoulAdminService::class.java))
            } finally {
                restartScheduled = false
                consecutiveFailures = 0
            }
        }, RESTART_DELAY_MS)
    }

    private fun createChannel() {
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel(CHANNEL, "Soul Admin", NotificationManager.IMPORTANCE_LOW))
    }

    private fun notification(text: String): Notification = Notification.Builder(this, CHANNEL)
        .setContentTitle("Soul Admin")
        .setContentText(text)
        .setSmallIcon(android.R.drawable.ic_menu_manage)
        .setOngoing(true)
        .build()

    private fun updateNotification(text: String) {
        getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification(text))
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY
    override fun onDestroy() { mainHandler.removeCallbacksAndMessages(null); scope.cancel(); super.onDestroy() }
    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "SoulSentinel"
        private const val MAX_CONSECUTIVE_FAILURES = 3
        private const val RESTART_DELAY_MS = 5_000L
        const val CHANNEL = "soul_admin"
        const val NOTIFICATION_ID = 7001
    }
}
