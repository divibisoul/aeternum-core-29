package com.divibisoul.soul

import android.content.Intent
import android.os.Bundle
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.core.content.ContextCompat
import org.json.JSONObject

/** Hosts the local hybrid UI and ensures the enabled Sentinel watchdog is running with the N01 UI. */
class SoulHybridActivity : ComponentActivity() {
    private lateinit var mesh: SoulMeshRuntime
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        startSentinelIfEnabled()
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
        webView.loadUrl(SoulSecureWebView.localUrl())
        setContentView(webView)
    }

    private fun startSentinelIfEnabled() {
        if (SoulConfig(this).enabled) {
            ContextCompat.startForegroundService(this, Intent(this, SoulAdminService::class.java))
        }
    }
}
