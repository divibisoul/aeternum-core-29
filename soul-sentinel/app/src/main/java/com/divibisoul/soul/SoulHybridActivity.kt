package com.divibisoul.soul

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.ComponentActivity

/** Hosts the local hybrid Soul UI and routes UI messages into the six-nucleus runtime. */
class SoulHybridActivity : ComponentActivity() {
    private lateinit var mesh: SoulMeshRuntime

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        mesh = SoulMeshBootstrap.create()
        val webView = WebView(this)
        SoulSecureWebView.configure(webView)
        SoulHybridBridge.attach(webView, SoulHybridBridge("N01") { message ->
            mesh.send(message.source, message.target, message.capability, message.payload)
        })
        webView.loadUrl(SoulSecureWebView.localUrl())
        setContentView(webView)
    }
}
