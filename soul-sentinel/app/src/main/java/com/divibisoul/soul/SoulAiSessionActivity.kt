package com.divibisoul.soul

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.ComponentActivity

/** Hosts a user-login session for an AI provider without collecting the user's password. */
class SoulAiSessionActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val providerId = intent.getStringExtra("provider") ?: SoulAiProvider.CHATGPT.name.lowercase()
        val registry = SoulAiProviderRegistry()
        val registration = registry.get(providerId)
            ?: registry.get(SoulAiProvider.CHATGPT.name.lowercase())
            ?: error("AI_PROVIDER_NOT_REGISTERED: $providerId")

        val webView = WebView(this)
        SoulSecureWebView.configure(webView)
        SoulAiWebSession(registration.hosts).attach(webView)

        val config = SoulConfig(this)
        val mesh = SoulMeshBootstrap.create(
            webDelegate = SoulMeshBootstrap::delegateToWeb,
            remoteEndpoints = config.meshEndpoints(),
        )
        val capabilityRegistry = SoulCapabilityRegistry()
        val pilot = SoulPilot(capabilityRegistry, mesh)
        webView.addJavascriptInterface(SoulAiSessionBridge(registration.id, pilot), "SoulAI")

        webView.loadUrl(registration.loginUrl)
        setContentView(webView)
    }
}
