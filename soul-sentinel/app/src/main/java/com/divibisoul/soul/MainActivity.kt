package com.divibisoul.soul

import android.app.ActivityManager
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import rikka.shizuku.Shizuku

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    SentinelScreen(this@MainActivity)
                }
            }
        }
    }
}

data class DeviceState(
    val battery: Int,
    val charging: Boolean,
    val ramUsedMb: Long,
    val ramTotalMb: Long,
    val network: String,
    val uptime: String,
    val shizuku: String
)

@Composable
private fun SentinelScreen(context: Context) {
    var state by remember { mutableStateOf(readDeviceState(context)) }

    LaunchedEffect(Unit) {
        while (true) {
            state = readDeviceState(context)
            kotlinx.coroutines.delay(1000)
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text("SOUL", style = MaterialTheme.typography.headlineLarge)
        Text("SENTINEL v0.2", style = MaterialTheme.typography.titleMedium)
        Text("● CORE                 ONLINE")
        Text("● DIAGNOSTICS          LIVE")
        Text("● CAPABILITY ENGINE    READY")
        Text("● EVENT BUS            READY")
        Text("")
        Text("DEVICE")
        Text("${Build.MANUFACTURER} ${Build.MODEL}")
        Text("Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})")
        Text("")
        Text("LIVE SYSTEM STATE")
        Text("Battery       ${state.battery}%${if (state.charging) "  ⚡ CHARGING" else ""}")
        Text("RAM           ${state.ramUsedMb} / ${state.ramTotalMb} MB")
        Text("Network       ${state.network}")
        Text("Uptime        ${state.uptime}")
        Text("")
        Text("SHIZUKU")
        Text(state.shizuku)
        Text("")
        Text("Milestone 002 — Living Sentinel")
    }
}

private fun readDeviceState(context: Context): DeviceState {
    val batteryManager = context.getSystemService(BatteryManager::class.java)
    val battery = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY).coerceIn(0, 100)
    val charging = batteryManager.isCharging

    val activityManager = context.getSystemService(ActivityManager::class.java)
    val memory = ActivityManager.MemoryInfo()
    activityManager.getMemoryInfo(memory)
    val totalMb = memory.totalMem / 1024 / 1024
    val availableMb = memory.availMem / 1024 / 1024

    val connectivity = context.getSystemService(ConnectivityManager::class.java)
    val network = connectivity.activeNetwork
    val caps = network?.let { connectivity.getNetworkCapabilities(it) }
    val networkLabel = when {
        caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> "Wi-Fi"
        caps?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "Mobile data"
        caps?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true -> "Ethernet"
        else -> "Offline"
    }

    val uptimeMs = SystemClock.elapsedRealtime()
    val hours = uptimeMs / 3_600_000
    val minutes = (uptimeMs / 60_000) % 60
    val seconds = (uptimeMs / 1_000) % 60

    return DeviceState(
        battery = battery,
        charging = charging,
        ramUsedMb = totalMb - availableMb,
        ramTotalMb = totalMb,
        network = networkLabel,
        uptime = "%02dh %02dm %02ds".format(hours, minutes, seconds),
        shizuku = shizukuStatus()
    )
}

private fun shizukuStatus(): String = try {
    when {
        !Shizuku.pingBinder() -> "UNAVAILABLE"
        Shizuku.checkSelfPermission() == android.content.pm.PackageManager.PERMISSION_GRANTED -> "AVAILABLE / AUTHORIZED"
        else -> "AVAILABLE / NOT AUTHORIZED"
    }
} catch (_: Throwable) {
    "UNAVAILABLE / ERROR"
}
