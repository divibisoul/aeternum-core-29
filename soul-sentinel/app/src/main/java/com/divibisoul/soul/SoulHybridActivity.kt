package com.divibisoul.soul

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.ComponentActivity

/** Hosts the local hybrid Soul UI inside the Android APK. */
class SoulHybridActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val webView = WebView(this)
        SoulSecureWebView.configure(webView)
        SoulHybridBridge.attach(webView, SoulHybridBridge("N01") { message -> message })
        webView.loadUrl("file:///android_asset/soul/index.html")
        setContentView(webView)
    }
}
