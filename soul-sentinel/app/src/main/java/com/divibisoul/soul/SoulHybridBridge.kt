package com.divibisoul.soul

import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONArray
import org.json.JSONObject

/** Bidirectional Android <-> WebView boundary. It exposes orchestration without merging UI and Cockpit. */
class SoulHybridBridge(
    private val nucleusId: String,
    private val sendToMesh: (SoulMeshMessage) -> SoulMeshMessage,
    private val onCompletion: (SoulMeshMessage) -> Unit,
    private val pilot: SoulPilot? = null,
    private val probe60: (() -> List<SoulMesh60ConnectionMatrix.Channel>)? = null,
    private val aiProviders: SoulAiProviderRegistry? = null,
) {
    @JavascriptInterface
    fun dispatch(rawJson: String): String = runCatching {
        val message = SoulMeshMessage.fromJson(JSONObject(rawJson))
        require(message.source == nucleusId) { "Web source does not match bridge nucleus" }
        sendToMesh(message).toJson().toString()
    }.getOrElse { error -> JSONObject().put("error", error.message ?: "Hybrid bridge error").toString() }

    @JavascriptInterface
    fun executeCapability(rawJson: String): String = runCatching {
        requireNotNull(pilot) { "PILOT_NOT_CONFIGURED" }
        val request = JSONObject(rawJson)
        val capability = request.getString("capability")
        val payload = request.optJSONObject("payload") ?: JSONObject()
        val task = pilot.execute(capability, payload)
        JSONObject().apply {
            put("accepted", true); put("taskId", task.taskId); put("capability", task.capability)
            put("owner", task.owner); put("correlationId", task.correlationId); put("response", task.response.toJson())
        }.toString()
    }.getOrElse { error -> JSONObject().put("error", error.message ?: "Pilot execution error").toString() }

    @JavascriptInterface
    fun capabilities(): String = runCatching {
        requireNotNull(pilot) { "PILOT_NOT_CONFIGURED" }
        pilot.registrySnapshot().toString()
    }.getOrElse { error -> JSONObject().put("error", error.message ?: "Capability registry error").toString() }

    @JavascriptInterface
    fun aiProviders(): String = runCatching {
        val registry = requireNotNull(aiProviders) { "AI_PROVIDER_REGISTRY_NOT_CONFIGURED" }
        JSONArray().apply {
            registry.allEnabled().forEach { provider ->
                put(JSONObject().apply {
                    put("id", provider.id)
                    put("displayName", provider.displayName)
                    put("role", provider.role)
                    put("loginUrl", provider.loginUrl)
                    put("hosts", JSONArray(provider.hosts.toList()))
                })
            }
        }.toString()
    }.getOrElse { error -> JSONObject().put("error", error.message ?: "AI provider registry error").toString() }

    @JavascriptInterface
    fun complete(rawJson: String): String = runCatching {
        val message = SoulMeshMessage.fromJson(JSONObject(rawJson))
        require(message.source == nucleusId) { "Completion source does not match bridge nucleus" }
        onCompletion(message)
        JSONObject().put("accepted", true).put("correlationId", message.correlationId).toString()
    }.getOrElse { error -> JSONObject().put("error", error.message ?: "Hybrid completion error").toString() }

    @JavascriptInterface
    fun probe60(): String = runCatching {
        val results = requireNotNull(probe60) { "MESH_60_PROBE_NOT_CONFIGURED" }.invoke()
        JSONArray().apply {
            results.forEach { result ->
                put(JSONObject().apply {
                    put("channelId", result.id); put("source", result.source); put("target", result.target)
                    put("configured", result.configured); put("reachable", result.reachable)
                    result.correlationId?.let { put("correlationId", it) }; result.error?.let { put("error", it) }
                    put("checkedAt", result.checkedAt)
                })
            }
        }.toString()
    }.getOrElse { error -> JSONObject().put("error", error.message ?: "60-channel probe error").toString() }

    companion object {
        fun attach(webView: WebView, bridge: SoulHybridBridge) {
            webView.settings.javaScriptEnabled = true
            webView.addJavascriptInterface(bridge, "SoulMesh")
        }
    }
}
