package com.divibisoul.soul

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
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

class MainActivity : ComponentActivity() {
    private lateinit var config: SoulConfig
    private var permissionRefresh: (() -> Unit)? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        config = SoulConfig(this)
        requestNotificationPermission()
        setContent { MaterialTheme { Surface { AdminScreen() } } }
    }

    override fun onResume() {
        super.onResume()
        permissionRefresh?.invoke()
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 42)
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
    private fun AdminScreen() {
        var enabled by remember { mutableStateOf(config.enabled) }
        var batteryThreshold by remember { mutableFloatStateOf(config.batteryThreshold.toFloat()) }
        var intervalSeconds by remember { mutableFloatStateOf(config.checkIntervalMs / 1000f) }
        var usageAccess by remember { mutableStateOf(hasUsageAccess()) }
        var canWrite by remember { mutableStateOf(Settings.System.canWrite(this@MainActivity)) }
        var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
        var refreshToken by remember { mutableIntStateOf(0) }

        LaunchedEffect(refreshToken) {
            usageAccess = hasUsageAccess()
            canWrite = Settings.System.canWrite(this@MainActivity)
            now = System.currentTimeMillis()
        }

        DisposableEffect(Unit) {
            permissionRefresh = { refreshToken++ }
            onDispose {
                permissionRefresh = null
                SoulBridgeRegistry.detach()
            }
        }

        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text("SOUL ADMIN", style = MaterialTheme.typography.displaySmall)
            Text(if (enabled) "ADMINISTRATOR ACTIVE" else "ADMINISTRATOR OFF")

            Card {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("AETERNUM CORE ↔ SENTINEL", style = MaterialTheme.typography.titleLarge)
                    SoulCoreView(Modifier.height(260.dp))
                    Text("Native Android events enter the Core through the versioned bridge.")
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(onClick = { startAdmin(); enabled = true }) { Text("ATIVAR ADMINISTRADOR") }
                OutlinedButton(onClick = { stopAdmin(); enabled = false }) { Text("DESATIVAR") }
            }

            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("PERMISSÕES / ACESSOS", style = MaterialTheme.typography.titleLarge)
                    Text("Usage Access: ${if (usageAccess) "GRANTED" else "REQUIRED"}")
                    Button(onClick = { startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) }) {
                        Text("ABRIR USAGE ACCESS")
                    }
                    Text("Modificar configurações: ${if (canWrite) "GRANTED" else "REQUIRED"}")
                    Button(onClick = {
                        startActivity(Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS, Uri.parse("package:$packageName")))
                    }) { Text("ABRIR MODIFICAR CONFIGURAÇÕES") }
                }
            }

            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("REGRAS", style = MaterialTheme.typography.titleLarge)
                    Text("Limite de bateria: ${batteryThreshold.toInt()}%")
                    Slider(
                        value = batteryThreshold,
                        onValueChange = { batteryThreshold = it },
                        valueRange = 5f..95f,
                        onValueChangeFinished = { config.batteryThreshold = batteryThreshold.toInt() }
                    )
                    Text("Intervalo: ${intervalSeconds.toInt()} s")
                    Slider(
                        value = intervalSeconds,
                        onValueChange = { intervalSeconds = it },
                        valueRange = 10f..300f,
                        onValueChangeFinished = { config.checkIntervalMs = intervalSeconds.toLong() * 1000 }
                    )
                }
            }

            Text("Estado atualizado: $now")
            Text("Soul Admin não executa ações protegidas silenciosamente.")
        }
    }

    private fun hasUsageAccess(): Boolean = try {
        val appOps = getSystemService(android.app.AppOpsManager::class.java)
        val mode = appOps.unsafeCheckOpNoThrow(
            "android:get_usage_stats", android.os.Process.myUid(), packageName
        )
        mode == android.app.AppOpsManager.MODE_ALLOWED
    } catch (_: Throwable) { false }
}
