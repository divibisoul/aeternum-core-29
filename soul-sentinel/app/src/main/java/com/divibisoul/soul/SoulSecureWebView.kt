package com.divibisoul.soul

import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader

/** Hardened WebView using an app-local HTTPS asset origin instead of file://. */
object SoulSecureWebView {
    private const val APP_ORIGIN = "https://appassets.androidplatform.net"

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
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(webView.context))
            .build()
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)

            override fun shouldInterceptRequest(view: WebView, url: String): WebResourceResponse? =
                loader.shouldInterceptRequest(android.net.Uri.parse(url))

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
                request.url.toString().startsWith(APP_ORIGIN).not()
        }
        WebView.setWebContentsDebuggingEnabled(false)
    }

    fun localUrl(path: String = "soul/index.html"): String = "$APP_ORIGIN/assets/$path"
}
