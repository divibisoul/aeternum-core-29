package com.divibisoul.soul

import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject

/** Android <-> WebView boundary for the hybrid Soul APK. */
class SoulHybridBridge(
    private val nucleusId: String,
    private val sendToMesh: (SoulMeshMessage) -> SoulMeshMessage,
) {
    @JavascriptInterface
    fun dispatch(rawJson: String): String = runCatching {
        val message = SoulMeshMessage.fromJson(JSONObject(rawJson))
        require(message.source == nucleusId) { "Web source does not match bridge nucleus" }
        sendToMesh(message).toJson().toString()
    }.getOrElse { error ->
        JSONObject().put("error", error.message ?: "Hybrid bridge error").toString()
    }

    companion object {
        fun attach(webView: WebView, bridge: SoulHybridBridge) {
            webView.settings.javaScriptEnabled = true
            webView.addJavascriptInterface(bridge, "SoulMesh")
        }
    }
}
