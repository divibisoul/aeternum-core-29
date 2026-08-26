package com.divibisoul.soul

import android.content.Context
import org.json.JSONObject
import java.time.Instant
import java.util.UUID

/**
 * Executes a capability in the runtime that owns it.
 *
 * Read-only N01 capabilities are executable directly. Mutating Android
 * capabilities require an explicit authorization callback; remote AI traffic
 * never receives implicit device privilege.
 */
class SoulHybridCapabilityExecutor(
    context: Context,
    private val webDelegate: (SoulMeshMessage) -> SoulMeshMessage,
    private val remoteTransport: SoulMeshTransport,
    private val authorize: (capability: String, payload: JSONObject) -> Boolean = { _, _ -> false },
) {
    private val actions = SoulActions(context)
    private val local = SoulN01LocalCapabilities(context)

    fun execute(message: SoulMeshMessage): SoulMeshMessage {
        message.validate().getOrThrow()
        val capability = SoulCapabilityCatalog.owner(message.capability)
        require(capability.owner == "N01") { "Capability ${capability.id} is owned by ${capability.owner}" }
        return when (capability.execution) {
            Execution.LOCAL -> local(message, capability.id)
            Execution.WEB_SESSION -> webDelegate(message)
            Execution.REMOTE_SERVICE -> remoteTransport.send(message)
        }
    }

    private fun local(message: SoulMeshMessage, capability: String): SoulMeshMessage {
        val payload = message.payload
        return when (capability) {
            "mesh.ping" -> response(message, JSONObject().put("ok", true).put("nucleus", "N01").put("runtime", "android"))
            "mesh.handshake" -> response(message, JSONObject().put("protocol", SoulMeshContract.PROTOCOL).put("nucleus", "N01").put("acceptedNuclei", SoulMeshContract.nucleusIds.toList()))
            "mesh.health" -> response(message, JSONObject().put("ok", true).put("nucleus", "N01").put("runtime", "android"))
            "mesh.capabilities" -> response(message, JSONObject().put("nucleus", "N01").put("capabilities", SoulCapabilityCatalog.ownedBy("N01").map { it.id }))
            "android.device_info" -> response(message, local.deviceInfo())
            "android.battery" -> response(message, local.battery())
            "android.memory" -> response(message, local.memory())
            "android.network" -> response(message, local.network())
            "android.wifi.state" -> response(message, JSONObject().put("enabled", actions.wifiEnabled()))
            "android.bluetooth.state" -> response(message, JSONObject().put("enabled", actions.bluetoothEnabled()))
            "android.brightness.set" -> authorized(message, capability) {
                val percent = payload.optInt("percent", -1)
                require(percent in 1..100) { "percent must be between 1 and 100" }
                val result = actions.setBrightness(percent)
                JSONObject().put("success", result.success).put("message", result.message)
            }
            "android.wifi.panel" -> authorized(message, capability) { actions.openWifiPanel(); JSONObject().put("accepted", true) }
            "android.bluetooth.request_enable" -> authorized(message, capability) { actions.requestBluetoothEnable(); JSONObject().put("accepted", true) }
            "android.airplane.settings" -> authorized(message, capability) { actions.openAirplaneSettings(); JSONObject().put("accepted", true) }
            "android.background.stop" -> authorized(message, capability) {
                val packageName = payload.optString("packageName")
                require(packageName.isNotBlank()) { "packageName is required" }
                val result = actions.killBackground(packageName)
                JSONObject().put("success", result.success).put("message", result.message)
            }
            else -> error(message, "LOCAL_CAPABILITY_NOT_IMPLEMENTED", capability)
        }
    }

    private fun authorized(message: SoulMeshMessage, capability: String, action: () -> JSONObject): SoulMeshMessage {
        if (!authorize(capability, message.payload)) return error(message, "AUTHORIZATION_REQUIRED", capability)
        return try { response(message, action()) }
        catch (t: Throwable) { error(message, "CAPABILITY_EXECUTION_ERROR", t.message ?: capability) }
    }

    private fun response(source: SoulMeshMessage, payload: JSONObject) = source.copy(
        id = UUID.randomUUID().toString(), source = source.target, target = source.source,
        kind = "response", payload = payload, timestamp = Instant.now().toString()
    )

    private fun error(source: SoulMeshMessage, code: String, detail: String) = source.copy(
        id = UUID.randomUUID().toString(), source = source.target, target = source.source,
        kind = "error", payload = JSONObject().put("code", code).put("detail", detail),
        timestamp = Instant.now().toString()
    )
}
