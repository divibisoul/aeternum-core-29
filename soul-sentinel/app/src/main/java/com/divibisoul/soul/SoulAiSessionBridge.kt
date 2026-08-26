package com.divibisoul.soul

import android.webkit.JavascriptInterface
import org.json.JSONObject

/** Controlled bridge from a trusted AI web session into the Soul Pilot. */
class SoulAiSessionBridge(
    private val providerId: String,
    private val pilot: SoulPilot,
) {
    @JavascriptInterface
    fun executeCapability(rawJson: String): String = runCatching {
        val request = JSONObject(rawJson)
        val capability = request.getString("capability")
        val payload = request.optJSONObject("payload") ?: JSONObject()
        val task = pilot.execute(capability, payload)
        JSONObject().apply {
            put("accepted", true)
            put("provider", providerId)
            put("taskId", task.taskId)
            put("correlationId", task.correlationId)
            put("capability", task.capability)
            put("owner", task.owner)
            put("response", task.response.toJson())
        }.toString()
    }.getOrElse { error ->
        JSONObject().put("accepted", false).put("provider", providerId).put("error", error.message ?: "AI session execution error").toString()
    }

    @JavascriptInterface
    fun provider(): String = providerId
}
