package com.divibisoul.soul

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.ComponentActivity

/** Hosts a user-login session for an AI provider without collecting the user's password. */
class SoulAiSessionActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val provider = runCatching {
            SoulAiProvider.valueOf(intent.getStringExtra("provider") ?: SoulAiProvider.CHATGPT.name)
        }.getOrDefault(SoulAiProvider.CHATGPT)
        val webView = WebView(this)
        SoulSecureWebView.configure(webView)
        SoulAiWebSession(setOf(provider.host, "www.${provider.host}")).attach(webView)
        webView.loadUrl(provider.loginUrl)
        setContentView(webView)
    }
}
