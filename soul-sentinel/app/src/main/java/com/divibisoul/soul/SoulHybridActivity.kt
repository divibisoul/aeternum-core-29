package com.divibisoul.soul

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.ComponentActivity
import org.json.JSONObject

/** Hosts the local hybrid UI and provides bidirectional Mesh <-> WebView execution. */
class SoulHybridActivity : ComponentActivity() {
    private lateinit var mesh: SoulMeshRuntime
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        mesh = SoulMeshBootstrap.create()
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
}
