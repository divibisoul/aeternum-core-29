package com.divibisoul.soul

import android.webkit.WebView
import java.lang.ref.WeakReference

/** Process-local bridge registry. The Android layer owns the WebView lifecycle. */
object SoulBridgeRegistry {
    private var bridgeRef: WeakReference<SoulNativeBridge>? = null

    @Synchronized
    fun attach(webView: WebView) {
        bridgeRef = WeakReference(SoulNativeBridge(webView).also { webView.addJavascriptInterface(it, "SoulNative") })
    }

    @Synchronized
    fun detach() {
        bridgeRef?.clear()
        bridgeRef = null
    }

    fun emitReady() = bridgeRef?.get()?.emitReady()
    fun emitContext(snapshot: Map<String, Any?>) = bridgeRef?.get()?.emitContext(snapshot)
    fun emitError(code: String, message: String) = bridgeRef?.get()?.emitError(code, message)
}
