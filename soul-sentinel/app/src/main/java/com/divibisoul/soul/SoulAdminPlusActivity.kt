package com.divibisoul.soul

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import com.divibisoul.soul.core.security.AuthAndSignature
import com.divibisoul.soul.core.security.LocalRole
import com.divibisoul.soul.core.security.PrivilegedAuthGate
import com.divibisoul.soul.core.security.RootGate
import com.divibisoul.soul.core.security.ShizukuOrchestrator
import com.divibisoul.soul.runtime.SoulAdminPlusRuntimeRegistry
import com.divibisoul.soul.core.federation.FederationStatusMatrix
import com.divibisoul.soul.core.state.DashboardState
import com.divibisoul.soul.core.state.DashboardStateStore
import com.divibisoul.soul.network.N07Client
import com.divibisoul.soul.network.N07Exception
import com.divibisoul.soul.network.SaraClient
import com.divibisoul.soul.network.SaraException
import com.divibisoul.soul.network.SecureEndpointConfigStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SoulAdminPlusActivity : FragmentActivity() {
    private lateinit var config: SecureEndpointConfigStore
    private lateinit var dashboard: DashboardStateStore
    private lateinit var sara: SaraClient
    private lateinit var n07: N07Client

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        config = SecureEndpointConfigStore(this)
        dashboard = DashboardStateStore(this)
        sara = SaraClient(config)
        n07 = N07Client(config)

        androidx.core.content.ContextCompat.startForegroundService(
            this,
            android.content.Intent(this, SoulAdminService::class.java)
        )

        setContent {
            MaterialTheme {
                Surface(Modifier.fillMaxSize()) {
                    PlusCockpit()
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
    }

    @Composable
    private fun PlusCockpit() {
        val scope = rememberCoroutineScope()
        val state = dashboard.state.collectAsState().value
        var loaded by remember { mutableStateOf(false) }
        var saraUrl by remember { mutableStateOf("") }
        var saraToken by remember { mutableStateOf("") }
        var n07Url by remember { mutableStateOf("") }
        var n07Token by remember { mutableStateOf("") }
        var timeoutMs by remember { mutableStateOf("10000") }
        var rootEnabled by remember { mutableStateOf(false) }
        var n07Enabled by remember { mutableStateOf(false) }
        var input by remember { mutableStateOf("Executar ciclo de validação do Soul Admin") }
        var output by remember { mutableStateOf("") }

        LaunchedEffect(Unit) {
            dashboard.load()
            val cfg = config.read()
            saraUrl = cfg.saraBaseUrl.orEmpty()
            n07Url = cfg.n07BaseUrl.orEmpty()
            timeoutMs = cfg.requestTimeoutMs.toString()
            rootEnabled = cfg.rootEnabled
            n07Enabled = cfg.n07Enabled
            loaded = true
        }

        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("SOUL ADMIN PLUS", style = MaterialTheme.typography.headlineMedium)
            Text("Federation: N01..N07 + SARA")
            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("FEDERATION BOUNDARIES", style = MaterialTheme.typography.titleLarge)
                    FederationStatusMatrix.initial().forEach { member ->
                        Text(member.node.id + " — " + member.status.name + " — " + member.authority)
                    }
                    Text("Status matrix is a boundary/ownership view, not proof of remote liveness.")
                }
            }

            StatusCard("Hardware", state.hardware)
            StatusCard("Battery / Thermal", state.batteryThermal)
            StatusCard("SARA", state.saraHealth)
            StatusCard("N07", state.n07Health)
            StatusCard("Privileged channel", state.rootStatus)
            StatusCard("Queue", state.queueDepth.toString())
            StatusCard("Last cycle", state.lastCycleId ?: "NONE")
            StatusCard("Last trace", state.lastTraceHash ?: "NONE")

            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("BACKEND CONFIG", style = MaterialTheme.typography.titleLarge)
                    OutlinedTextField(saraUrl, { saraUrl = it }, label = { Text("SARA_BASE_URL") })
                    OutlinedTextField(
                        saraToken, { saraToken = it },
                        label = { Text("SARA_API_TOKEN") },
                        visualTransformation = PasswordVisualTransformation()
                    )
                    OutlinedTextField(n07Url, { n07Url = it }, label = { Text("N07_BASE_URL") })
                    OutlinedTextField(
                        n07Token, { n07Token = it },
                        label = { Text("N07_TOKEN") },
                        visualTransformation = PasswordVisualTransformation()
                    )
                    OutlinedTextField(
                        timeoutMs, { timeoutMs = it.filter(Char::isDigit) },
                        label = { Text("REQUEST_TIMEOUT_MS") }
                    )
                    Row {
                        Checkbox(checked = rootEnabled, onCheckedChange = { rootEnabled = it })
                        Text("FEATURE_ROOT_ENABLED")
                    }
                    Row {
                        Checkbox(checked = n07Enabled, onCheckedChange = { n07Enabled = it })
                        Text("FEATURE_N07_ENABLED")
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = {
                            scope.launch {
                                config.setSara(saraUrl, saraToken.takeIf(String::isNotBlank))
                                config.setN07(n07Url.takeIf(String::isNotBlank), n07Token.takeIf(String::isNotBlank))
                                config.setTimeout(timeoutMs.toLongOrNull() ?: 10_000L)
                                config.setFeatureFlags(rootEnabled, n07Enabled)
                                output = "CONFIG_SAVED"
                            }
                        }) { Text("SALVAR") }
                        OutlinedButton(onClick = {
                            scope.launch { ShizukuOrchestrator().requestPermissionIfNeeded() }
                        }) { Text("SOLICITAR SHIZUKU") }
                    }
                }
            }

            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("MISSÕES SARA", style = MaterialTheme.typography.titleLarge)
                    OutlinedTextField(input, { input = it }, label = { Text("Entrada") })
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = {
                            scope.launch {
                                try {
                                    val runtime = SoulAdminPlusRuntimeRegistry.get(
                                        this@SoulAdminPlusActivity,
                                        SoulRuntimeBusHolder.bus ?: SoulRuntimeBusHolder.create()
                                    )
                                    runtime.runCycle(input)
                                    output = "MISSION_ENQUEUED"
                                } catch (e: Exception) {
                                    output = e.message ?: "MISSION_ERROR"
                                }
                            }
                        }) { Text("RUN CYCLE") }

                        OutlinedButton(onClick = {
                            scope.launch {
                                try {
                                    output = sara.audit(input).toString()
                                } catch (e: SaraException) {
                                    output = e.code + ": " + e.message
                                }
                            }
                        }) { Text("AUDIT") }

                        OutlinedButton(onClick = {
                            scope.launch {
                                try {
                                    output = sara.regenerate(input).toString()
                                } catch (e: SaraException) {
                                    output = e.code + ": " + e.message
                                }
                            }
                        }) { Text("REGENERATE") }
                    }
                    OutlinedButton(onClick = {
                        scope.launch {
                            try {
                                output = sara.health().toString()
                            } catch (e: SaraException) {
                                output = e.code + ": " + e.message
                            }
                        }
                    }) { Text("REFRESH SARA HEALTH") }
                }
            }

            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("N07", style = MaterialTheme.typography.titleLarge)
                    Button(onClick = {
                        scope.launch {
                            try {
                                output = n07.health().toString()
                            } catch (e: N07Exception) {
                                output = e.code + ": " + e.message
                            }
                        }
                    }) { Text("REFRESH N07 HEALTH") }
                }
            }

            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("PRIVILEGED DIAGNOSTIC", style = MaterialTheme.typography.titleLarge)
                    Button(onClick = {
                        scope.launch {
                            val gate = PrivilegedAuthGate(AuthAndSignature(this@SoulAdminPlusActivity))
                            val allowed = gate.authenticate(
                                this@SoulAdminPlusActivity,
                                LocalRole.OPERATOR,
                                "Diagnóstico privilegiado: somente leitura"
                            )
                            if (!allowed) {
                                output = "PRIVILEGED_AUTH_DENIED"
                                return@launch
                            }

                            output = withContext(Dispatchers.IO) {
                                val shizuku = ShizukuOrchestrator().state()
                                val cfg = config.read()
                                if (shizuku.running && shizuku.permissionGranted) {
                                    runCatching { ShizukuOrchestrator().execute("id") }.getOrElse {
                                        "SHIZUKU_ERROR: " + (it.message ?: "unknown")
                                    }
                                } else if (cfg.rootEnabled) {
                                    val rootStatus = RootGate().status()
                                    if (rootStatus.available) "ROOT_AVAILABLE" else "NO_PRIVILEGED_CHANNEL"
                                } else {
                                    "NO_PRIVILEGED_CHANNEL"
                                }
                            }
                        }
                    }) { Text("DIAGNOSTICAR CANAL") }
                }
            }

            if (loaded) Text(output.ifBlank { "READY" })
            if (state.errors.isNotEmpty()) {
                Text("Errors: " + state.errors.takeLast(5).joinToString(" | "))
            }
        }
    }

    @Composable
    private fun StatusCard(label: String, value: String) {
        Card {
            Row(Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(label + ":")
                Text(value)
            }
        }
    }
}
