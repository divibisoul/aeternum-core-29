package com.divibisoul.soul

import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject
import java.util.UUID

/**
 * Explicit Sentinel -> Aeternum bridge.
 *
 * Android owns perception. This class only serializes normalized events and
 * delivers them to the Core WebView. It never reimplements Android services.
 */
class SoulNativeBridge(private val webView: WebView) {

    @JavascriptInterface
    fun postMessage(message: String) {
        // Core -> Android requests will be validated here in the next contract.
        // Do not execute arbitrary Android commands from this entry point.
        try {
            val json = JSONObject(message)
            if (json.optInt("version") != 1) return
            if (json.optString("source") != "aeternum-core") return
            // Intentionally no privileged execution in connection #1.
        } catch (_: Exception) {
            // Invalid bridge payloads are ignored at the security boundary.
        }
    }

    fun emitContext(snapshot: Map<String, Any?>) {
        emit("android:context:update", JSONObject(snapshot))
    }

    fun emitReady() {
        emit(
            "android:ready",
            JSONObject().put("sentinel", "soul-sentinel").put("contractVersion", 1)
        )
    }

    fun emitError(code: String, message: String) {
        emit(
            "android:error",
            JSONObject().put("code", code).put("message", message)
        )
    }

    private fun emit(event: String, payload: JSONObject) {
        val envelope = JSONObject()
            .put("version", 1)
            .put("source", "soul-sentinel")
            .put("event", event)
            .put("timestamp", System.currentTimeMillis())
            .put("correlationId", UUID.randomUUID().toString())
            .put("payload", payload)

        val encoded = JSONObject.quote(envelope.toString())
        webView.post {
            webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('soul:native:event',{detail:JSON.parse($encoded)}));",
                null
            )
        }
    }
}
