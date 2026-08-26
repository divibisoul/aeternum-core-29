package com.divibisoul.soul

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.ComponentActivity
import org.json.JSONObject

/** User-facing hybrid APK host: WebView/AI session + native Mesh/Pilot boundary. */
class SoulHybridActivity : ComponentActivity() {
    private lateinit var mesh: SoulMeshRuntime
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val config = SoulConfig(this)
        mesh = SoulMeshBootstrap.create(
            webDelegate = SoulMeshBootstrap::delegateToWeb,
            remoteEndpoints = config.meshEndpoints(),
        )
        val mesh60 = SoulMesh60ChannelAccess(config.meshEndpoints())
        webView = WebView(this)
        SoulSecureWebView.configure(webView)
        SoulHybridBridge.attach(webView, SoulHybridBridge("N01", { message ->
            mesh.send(message.source, message.target, message.capability ?: "", message.payload)
        }, { completion ->
            webView.post {
                val json = JSONObject.quote(completion.toJson().toString())
                webView.evaluateJavascript("window.SoulHybridRuntime&&window.SoulHybridRuntime.receive(JSON.parse($json));", null)
            }
        }, probe60 = { mesh60.probeAll() }))
        webView.loadUrl(SoulSecureWebView.localUrl())
        setContentView(webView)
    }
}
