package com.divibisoul.soul

import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject

/** Bidirectional Android <-> WebView boundary for the hybrid Soul APK. */
class SoulHybridBridge(
    private val nucleusId: String,
    private val sendToMesh: (SoulMeshMessage) -> SoulMeshMessage,
    private val onCompletion: (SoulMeshMessage) -> Unit,
) {
    @JavascriptInterface
    fun dispatch(rawJson: String): String = runCatching {
        val message = SoulMeshMessage.fromJson(JSONObject(rawJson))
        require(message.source == nucleusId) { "Web source does not match bridge nucleus" }
        sendToMesh(message).toJson().toString()
    }.getOrElse { error ->
        JSONObject().put("error", error.message ?: "Hybrid bridge error").toString()
    }

    @JavascriptInterface
    fun complete(rawJson: String): String = runCatching {
        val message = SoulMeshMessage.fromJson(JSONObject(rawJson))
        require(message.source == nucleusId) { "Completion source does not match bridge nucleus" }
        onCompletion(message)
        JSONObject().put("accepted", true).put("correlationId", message.correlationId).toString()
    }.getOrElse { error ->
        JSONObject().put("error", error.message ?: "Hybrid completion error").toString()
    }

    companion object {
        fun attach(webView: WebView, bridge: SoulHybridBridge) {
            webView.settings.javaScriptEnabled = true
            webView.addJavascriptInterface(bridge, "SoulMesh")
        }
    }
}
