package com.divibisoul.soul

import android.Manifest
import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.BatteryManager
import android.os.SystemClock
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.divibisoul.soul.core.SoulEvent
import com.divibisoul.soul.core.SoulEventBus
import com.divibisoul.soul.core.SystemEventCollector
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import rikka.shizuku.Shizuku

class MainActivity : ComponentActivity() {
    private val eventBus = SoulEventBus()
    private lateinit var collector: SystemEventCollector
    private lateinit var config: SoulConfig
    private var permissionRefresh: (() -> Unit)? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        config = SoulConfig(this)
        collector = SystemEventCollector(this, eventBus)
        collector.start()
        requestNotificationPermission()
        setContent { MaterialTheme { Surface { SoulCockpit(this@MainActivity, eventBus) } } }
    }

    override fun onResume() {
        super.onResume()
        permissionRefresh?.invoke()
    }

    override fun onDestroy() {
        collector.stop()
        super.onDestroy()
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 42)
        }
    }

    private fun startAdmin() {
        config.enabled = true
        ContextCompat.startForegroundService(this, Intent(this, SoulAdminService::class.java))
    }

    private fun stopAdmin() {
        config.enabled = false
        stopService(Intent(this, SoulAdminService::class.java))
    }

    @Composable
    private fun SoulCockpit(context: Context, bus: SoulEventBus) {
        var battery by remember { mutableStateOf(readBattery(context)) }
        var charging by remember { mutableStateOf(false) }
        var network by remember { mutableStateOf("Detecting…") }
        var screen by remember { mutableStateOf("ON") }
        var shizuku by remember { mutableStateOf(shizukuStatus()) }
        var events by remember { mutableStateOf(0) }
        var lastEvent by remember { mutableStateOf("Soul started") }
        var uptime by remember { mutableStateOf("00:00:00") }
        var ram by remember { mutableStateOf("—") }
        var enabled by remember { mutableStateOf(config.enabled) }
        var batteryThreshold by remember { mutableFloatStateOf(config.batteryThreshold.toFloat()) }
        var intervalSeconds by remember { mutableFloatStateOf(config.checkIntervalMs / 1000f) }
        var usageAccess by remember { mutableStateOf(hasUsageAccess()) }
        var canWrite by remember { mutableStateOf(Settings.System.canWrite(context)) }
        var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
        var refreshToken by remember { mutableIntStateOf(0) }

        LaunchedEffect(Unit) {
            bus.events.collectLatest { event ->
                events++
                lastEvent = eventLabel(event)
                when (event) {
                    is SoulEvent.BatteryChanged -> { battery = event.level; charging = event.charging }
                    is SoulEvent.NetworkChanged -> network = event.transport
                    is SoulEvent.ScreenChanged -> screen = if (event.on) "ON" else "OFF"
                    is SoulEvent.ShizukuChanged -> shizuku = event.status
                    else -> Unit
                }
            }
        }

        LaunchedEffect(Unit) {
            while (true) {
                uptime = formatUptime(SystemClock.elapsedRealtime())
                ram = readRam(context)
                shizuku = shizukuStatus()
                usageAccess = hasUsageAccess()
                canWrite = Settings.System.canWrite(context)
                now = System.currentTimeMillis()
                delay(1000)
            }
        }

        LaunchedEffect(refreshToken) {
            usageAccess = hasUsageAccess()
            canWrite = Settings.System.canWrite(context)
        }

        DisposableEffect(Unit) {
            permissionRefresh = { refreshToken++ }
            onDispose { permissionRefresh = null }
        }

        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("SOUL", style = MaterialTheme.typography.displaySmall)
            Text("HYBRID GPU • COCKPIT / SENTINEL", style = MaterialTheme.typography.titleMedium)
            Text("APK gateway + local system runtime + hybrid control surface")

            Card { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("FABRIC", style = MaterialTheme.typography.titleLarge)
                Status("Local Core", "ONLINE")
                Status("Event Bus", "ONLINE • $events events")
                Status("Guardian", "ARMED / OBSERVE")
                Status("Shizuku", shizuku)
                Status("Hybrid AI", "SESSION-BASED")
                Status("Execution", "PARALLEL-CAPABLE")
            }}

            Card { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("LIVE DEVICE STATE", style = MaterialTheme.typography.titleLarge)
                Status("Battery", "$battery%${if (charging) " • CHARGING" else ""}")
                Status("RAM", ram)
                Status("Network", network)
                Status("Screen", screen)
                Status("Uptime", uptime)
            }}

            Card { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("ADMINISTRATOR", style = MaterialTheme.typography.titleLarge)
                Status("Service", if (enabled) "ACTIVE" else "OFF")
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(onClick = { startAdmin(); enabled = true }) { Text("ATIVAR") }
                    OutlinedButton(onClick = { stopAdmin(); enabled = false }) { Text("DESATIVAR") }
                }
                Text("Battery threshold: ${batteryThreshold.toInt()}%")
                Slider(value = batteryThreshold, onValueChange = { batteryThreshold = it }, valueRange = 5f..95f,
                    onValueChangeFinished = { config.batteryThreshold = batteryThreshold.toInt() })
                Text("Check interval: ${intervalSeconds.toInt()} s")
                Slider(value = intervalSeconds, onValueChange = { intervalSeconds = it }, valueRange = 10f..300f,
                    onValueChangeFinished = { config.checkIntervalMs = intervalSeconds.toLong() * 1000L })
            }}

            Card { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("ACCESS", style = MaterialTheme.typography.titleLarge)
                Status("Usage Access", if (usageAccess) "GRANTED" else "REQUIRED")
                Button(onClick = { context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) }) { Text("ABRIR USAGE ACCESS") }
                Status("Write Settings", if (canWrite) "GRANTED" else "REQUIRED")
                Button(onClick = {
                    context.startActivity(Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS, Uri.parse("package:${context.packageName}")))
                }) { Text("ABRIR WRITE SETTINGS") }
            }}

            Card { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("EVENT STREAM", style = MaterialTheme.typography.titleLarge)
                Text("Last: $lastEvent")
                Text("Events received: $events")
                Text("Sense → Event → State → Guardian → Action")
            }}

            Text("Android ${Build.VERSION.RELEASE} • API ${Build.VERSION.SDK_INT}")
            Text("Soul does not claim hardware acceleration it cannot prove; it optimizes orchestration, concurrency and routing where the platform permits.")
            Text("Updated: $now")
        }
    }

    @Composable
    private fun Status(label: String, value: String) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(label, modifier = Modifier.weight(1f))
            Text(value)
        }
    }

    private fun readBattery(context: Context): Int = context.getSystemService(BatteryManager::class.java)
        .getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY).coerceIn(0, 100)

    private fun readRam(context: Context): String {
        val info = ActivityManager.MemoryInfo()
        context.getSystemService(ActivityManager::class.java).getMemoryInfo(info)
        val used = (info.totalMem - info.availMem) / 1024 / 1024
        val total = info.totalMem / 1024 / 1024
        return "$used / $total MB"
    }

    private fun shizukuStatus(): String = try {
        when {
            !Shizuku.pingBinder() -> "UNAVAILABLE"
            Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED -> "AUTHORIZED"
            else -> "NOT AUTHORIZED"
        }
    } catch (_: Throwable) { "ERROR" }

    private fun eventLabel(event: SoulEvent): String = when (event) {
        is SoulEvent.BatteryChanged -> "Battery ${event.level}%"
        is SoulEvent.NetworkChanged -> "Network ${event.transport}"
        is SoulEvent.ScreenChanged -> "Screen ${if (event.on) "ON" else "OFF"}"
        is SoulEvent.AppForeground -> "App ${event.packageName}"
        is SoulEvent.ShizukuChanged -> "Shizuku ${event.status}"
        is SoulEvent.Tick -> "Tick"
    }

    private fun formatUptime(ms: Long): String {
        val totalSeconds = ms / 1000
        val h = totalSeconds / 3600
        val m = (totalSeconds % 3600) / 60
        val s = totalSeconds % 60
        return "%02d:%02d:%02d".format(h, m, s)
    }

    private fun hasUsageAccess(): Boolean = try {
        val appOps = getSystemService(android.app.AppOpsManager::class.java)
        val mode = appOps.unsafeCheckOpNoThrow("android:get_usage_stats", android.os.Process.myUid(), packageName)
        mode == android.app.AppOpsManager.MODE_ALLOWED
    } catch (_: Throwable) { false }
}
