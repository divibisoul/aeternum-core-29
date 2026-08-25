package com.divibisoul.soul

import android.os.Bundle
import android.os.Build
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import rikka.shizuku.Shizuku

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val shizuku = shizukuStatus()
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    SentinelScreen(
                        androidVersion = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})",
                        device = "${Build.MANUFACTURER} ${Build.MODEL}",
                        shizuku = shizuku
                    )
                }
            }
        }
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
}

@Composable
private fun SentinelScreen(androidVersion: String, device: String, shizuku: String) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("SOUL", style = MaterialTheme.typography.headlineLarge)
        Text("SENTINEL v0.1", style = MaterialTheme.typography.titleMedium)
        Text("● CORE                 ONLINE")
        Text("● DIAGNOSTICS          ONLINE")
        Text("● CAPABILITY ENGINE    ONLINE")
        Text("● EVENT BUS            ONLINE")
        Text("")
        Text("DEVICE")
        Text(device)
        Text(androidVersion)
        Text("")
        Text("SHIZUKU")
        Text(shizuku)
        Text("")
        Text("Milestone 001 — Sentinel")
    }
}
