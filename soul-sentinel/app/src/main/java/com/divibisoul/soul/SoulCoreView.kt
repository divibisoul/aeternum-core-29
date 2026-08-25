package com.divibisoul.soul

import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader

@Composable
fun SoulCoreView(modifier: Modifier = Modifier) {
    AndroidView(
        modifier = modifier,
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.allowFileAccess = false
                settings.allowContentAccess = true
                webViewClient = WebViewClient()
                webChromeClient = WebChromeClient()

                val assetLoader = WebViewAssetLoader.Builder()
                    .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
                    .build()
                webViewClient = object : WebViewClient() {
                    override fun shouldInterceptRequest(
                        view: WebView,
                        url: String
                    ) = assetLoader.shouldInterceptRequest(url)
                }

                SoulBridgeRegistry.attach(this)
                loadUrl("https://appassets.androidplatform.net/assets/aeternum/index.html")
            }
        },
        update = { SoulBridgeRegistry.emitReady() }
    )
}
