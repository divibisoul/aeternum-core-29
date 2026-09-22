package com.divibisoul.soul

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.ComponentActivity
import com.divibisoul.soul.core.SoulEvent
import com.divibisoul.soul.core.SoulEventBus
import com.divibisoul.soul.core.SystemEventCollector
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.collect
import org.json.JSONObject

/** Hosts the local hybrid UI and provides bidirectional Mesh <-> WebView execution. */
class SoulHybridActivity : ComponentActivity() {
    private lateinit var mesh: SoulMeshRuntime
    private lateinit var webView: WebView
    private lateinit var eventBus: SoulEventBus
    private lateinit var eventCollector: SystemEventCollector
    private val eventScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        eventBus = SoulEventBus()
        eventCollector = SystemEventCollector(this, eventBus)
        eventCollector.start()

        mesh = SoulMeshBootstrap.create(webDelegate = { message ->
            SoulMeshBootstrap.delegateToWeb(message)
        })
        webView = WebView(this)
        SoulSecureWebView.configure(webView)
        SoulHybridBridge.attach(webView, SoulHybridBridge("N01", { message ->
            mesh.send(message.source, message.target, message.capability, message.payload)
        }, { completion ->
            webView.post {
                val json = JSONObject.quote(completion.toJson().toString())
                webView.evaluateJavascript("window.SoulHybridRuntime&&window.SoulHybridRuntime.receive(JSON.parse($json));", null)
            }
        }))
        eventScope.launch {
            eventBus.events.collect { event ->
                if (event is SoulEvent.DeviceSnapshot) {
                    webView.post { sendDeviceSnapshotToClareira(event) }
                }
            }
        }

        webView.loadUrl(SoulSecureWebView.localUrl())
        setContentView(webView)
    }

    private fun sendDeviceSnapshotToClareira(snapshot: SoulEvent.DeviceSnapshot) {
        val json = JSONObject()
            .put("batteryPercent", snapshot.batteryPercent)
            .put("charging", snapshot.charging)
            .put("batteryTemperatureC", snapshot.batteryTemperatureC)
            .put("screenOn", snapshot.screenOn)
            .put("network", snapshot.network)
            .put("shizukuStatus", snapshot.shizukuStatus)
            .put("timestamp", snapshot.timestamp)
            .toString()
        webView.evaluateJavascript(
            "window.dispatchEvent(new CustomEvent('soul:device-state',{detail:$json}));",
            null
        )
    }

    override fun onDestroy() {
        eventCollector.stop()
        eventScope.cancel()
        super.onDestroy()
    }
}
