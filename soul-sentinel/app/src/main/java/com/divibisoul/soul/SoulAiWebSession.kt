package com.divibisoul.soul

import android.webkit.CookieManager
import android.webkit.WebView
import android.webkit.WebViewClient

/** User-authenticated AI web session: login occurs in the provider's web UI, not through an API key. */
class SoulAiWebSession(private val trustedHosts: Set<String>) {
    fun attach(webView: WebView) {
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = false
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                val host = runCatching { java.net.URI(url).host }.getOrNull() ?: return true
                return host !in trustedHosts
            }
        }
        CookieManager.getInstance().setAcceptCookie(true)
    }

    fun clearSession(webView: WebView) {
        CookieManager.getInstance().removeAllCookies(null)
        webView.clearCache(true)
        webView.clearHistory()
    }
}
