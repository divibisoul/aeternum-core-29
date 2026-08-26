package com.divibisoul.soul

import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

/** Hardened WebView defaults for the hybrid Soul UI. */
object SoulSecureWebView {
    fun configure(webView: WebView) {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
        }
        webView.webViewClient = WebViewClient()
        WebView.setWebContentsDebuggingEnabled(false)
    }
}
