package com.divibisoul.soul

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.ComponentActivity
import org.json.JSONObject

/**
 * User-facing hybrid APK host. The WebView is the UI/AI-session boundary;
 * the Mesh runtime is the system boundary. N01 can address capabilities owned
 * by any nucleus without requiring those nuclei to be packaged into the APK.
 */
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
        webView = WebView(this)
        SoulSecureWebView.configure(webView)
        SoulHybridBridge.attach(webView, SoulHybridBridge("N01", { message ->
            mesh.send(message.source, message.target, message.capability ?: "", message.payload)
        }, { completion ->
            webView.post {
                val json = JSONObject.quote(completion.toJson().toString())
                webView.evaluateJavascript("window.SoulHybridRuntime&&window.SoulHybridRuntime.receive(JSON.parse($json));", null)
            }
        }))
        webView.loadUrl(SoulSecureWebView.localUrl())
        setContentView(webView)
    }
}
