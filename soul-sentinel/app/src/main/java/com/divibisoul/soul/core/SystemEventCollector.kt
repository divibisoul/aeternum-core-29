package com.divibisoul.soul.core

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager

class SystemEventCollector(
    private val context: Context,
    private val bus: SoulEventBus
) {
    private var receiver: BroadcastReceiver? = null

    fun start() {
        if (receiver != null) return
        receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                when (intent.action) {
                    Intent.ACTION_BATTERY_CHANGED -> {
                        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, 100).coerceAtLeast(1)
                        val pct = (level * 100 / scale).coerceIn(0, 100)
                        val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
                        val charging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
                        val batteryTemp = intent.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, Int.MIN_VALUE)
                            .takeIf { it != Int.MIN_VALUE }
                            ?.div(10.0)
                        bus.publish(SoulEvent.BatteryChanged(pct, charging))
                        publishDeviceSnapshot(pct, charging, batteryTemp)
                    }
                    Intent.ACTION_SCREEN_ON -> {
                        bus.publish(SoulEvent.ScreenChanged(true))
                        publishCurrentDeviceSnapshot()
                    }
                    Intent.ACTION_SCREEN_OFF -> {
                        bus.publish(SoulEvent.ScreenChanged(false))
                        publishCurrentDeviceSnapshot()
                    }
                    ConnectivityManager.CONNECTIVITY_ACTION -> {
                        bus.publish(SoulEvent.NetworkChanged(readNetwork()))
                        publishCurrentDeviceSnapshot()
                    }
                }
            }
        }

        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_BATTERY_CHANGED)
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(ConnectivityManager.CONNECTIVITY_ACTION)
        }
        if (Build.VERSION.SDK_INT >= 33) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION") context.registerReceiver(receiver, filter)
        }
        val bm = context.getSystemService(BatteryManager::class.java)
        val batteryIntent = context.registerReceiver(
            null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        )
        val pct = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY).coerceIn(0, 100)
        val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val charging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
            status == BatteryManager.BATTERY_STATUS_FULL
        val batteryTemp = batteryIntent
            ?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, Int.MIN_VALUE)
            ?.takeIf { it != Int.MIN_VALUE }
            ?.div(10.0)
        bus.publish(SoulEvent.NetworkChanged(readNetwork()))
        bus.publish(SoulEvent.ShizukuChanged(shizukuStatus()))
        publishDeviceSnapshot(pct, charging, batteryTemp)
    }

    fun stop() {
        receiver?.let { context.unregisterReceiver(it) }
        receiver = null
    }

    private fun publishDeviceSnapshot(
        batteryPercent: Int,
        charging: Boolean,
        batteryTemperatureC: Double?
    ) {
        val screenOn = context.getSystemService(PowerManager::class.java).isInteractive
        bus.publish(
            SoulEvent.DeviceSnapshot(
                batteryPercent = batteryPercent.coerceIn(0, 100),
                charging = charging,
                batteryTemperatureC = batteryTemperatureC,
                screenOn = screenOn,
                network = readNetwork(),
                shizukuStatus = shizukuStatus(),
                cpuFreqMhz = readCpuFreqMhz(),
                ramUsedMb = readRamUsedMb(),
                ramTotalMb = readRamTotalMb(),
                foregroundPackage = readForegroundPackage(),
                wifiEnabled = readWifiEnabled(),
                bluetoothEnabled = readBluetoothEnabled()
            )
        )
    }

    private fun readCpuFreqMhz(): Double? = try {
        java.io.File("/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq")
            .takeIf { it.canRead() }
            ?.readText()
            ?.trim()
            ?.toLongOrNull()
            ?.div(1000.0)
    } catch (_: Throwable) { null }

    private fun readRamTotalMb(): Long? = try {
        android.app.ActivityManager.MemoryInfo().also {
            context.getSystemService(android.app.ActivityManager::class.java)?.getMemoryInfo(it)
        }.totalMem.takeIf { it > 0 }?.div(1024L * 1024L)
    } catch (_: Throwable) { null }

    private fun readRamUsedMb(): Long? = try {
        val info = android.app.ActivityManager.MemoryInfo().also {
            context.getSystemService(android.app.ActivityManager::class.java)?.getMemoryInfo(it)
        }
        if (info.totalMem <= 0 || info.availMem < 0) null
        else ((info.totalMem - info.availMem).coerceAtLeast(0) / (1024L * 1024L))
    } catch (_: Throwable) { null }

    private fun readForegroundPackage(): String? = try {
        SoulCortex(context, SoulConfig(context)).foregroundPackage()
    } catch (_: Throwable) { null }

    private fun readWifiEnabled(): Boolean = try {
        context.getSystemService(android.net.wifi.WifiManager::class.java)?.isWifiEnabled == true
    } catch (_: Throwable) { false }

    private fun readBluetoothEnabled(): Boolean = try {
        context.getSystemService(android.bluetooth.BluetoothManager::class.java)?.adapter?.isEnabled == true
    } catch (_: Throwable) { false }

    private fun readNetwork(): String {
        val cm = context.getSystemService(ConnectivityManager::class.java)
        val network = cm.activeNetwork ?: return "Offline"
        val caps = cm.getNetworkCapabilities(network) ?: return "Offline"
        return when {
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "Wi-Fi"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "Mobile data"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "Ethernet"
            else -> "Connected"
        }
    }

    private fun shizukuStatus(): String = try {
        when {
            !rikka.shizuku.Shizuku.pingBinder() -> "UNAVAILABLE"
            rikka.shizuku.Shizuku.checkSelfPermission() == android.content.pm.PackageManager.PERMISSION_GRANTED -> "AUTHORIZED"
            else -> "NOT AUTHORIZED"
        }
    } catch (_: Throwable) { "ERROR" }
}
