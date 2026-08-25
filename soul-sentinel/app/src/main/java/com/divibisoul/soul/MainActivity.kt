package com.divibisoul.soul

import android.app.ActivityManager
import android.content.Context
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.divibisoul.soul.core.SoulEvent
import com.divibisoul.soul.core.SoulEventBus
import com.divibisoul.soul.core.SystemEventCollector
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import rikka.shizuku.Shizuku

class MainActivity : ComponentActivity() {
    private val eventBus = SoulEventBus()
    private lateinit var collector: SystemEventCollector

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        collector = SystemEventCollector(this, eventBus)
        collector.start()
        setContent { MaterialTheme { Surface { SoulCockpit(this@MainActivity, eventBus) } } }
    }

    override fun onDestroy() {
        collector.stop()
        super.onDestroy()
    }
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
            delay(1000)
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("SOUL", style = MaterialTheme.typography.displaySmall)
        Text("CORE • SENTINEL", style = MaterialTheme.typography.titleMedium)
        Text("Milestone 002 — Living Core", style = MaterialTheme.typography.bodyMedium)

        Card { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("ORGANISM", style = MaterialTheme.typography.titleLarge)
            Status("Core", "ONLINE")
            Status("Event Bus", "ONLINE • $events events")
            Status("Guardian", "ARMED / OBSERVE")
            Status("Shizuku", shizuku)
        }}

        Card { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("LIVE STATE", style = MaterialTheme.typography.titleLarge)
            Status("Battery", "$battery%${if (charging) " • CHARGING" else ""}")
            Status("RAM", ram)
            Status("Network", network)
            Status("Screen", screen)
            Status("Uptime", uptime)
        }}

        Card { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("EVENT STREAM", style = MaterialTheme.typography.titleLarge)
            Text("Last: $lastEvent")
            Text("Events received: $events")
            Text("Sense → Event → State → Guardian → Action")
        }}

        Text("Android ${Build.VERSION.RELEASE} • API ${Build.VERSION.SDK_INT}")
        Text("No privileged action is executed automatically.")
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
        Shizuku.checkSelfPermission() == android.content.pm.PackageManager.PERMISSION_GRANTED -> "AUTHORIZED"
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
