package com.divibisoul.soul

import org.json.JSONObject

/** Builds the APK runtime without claiming that remote nuclei are local. */
object SoulMeshBootstrap {
    fun create(
        webDelegate: (SoulMeshMessage) -> SoulMeshMessage,
        remoteEndpoints: Map<String, String> = emptyMap(),
    ): SoulMeshRuntime {
        val remote = SoulMeshTransport(remoteEndpoints)
        val runtime = SoulMeshRuntime(remote = remote)
        val executor = SoulHybridCapabilityExecutor(webDelegate, remote)

        val localHandlers = SoulCapabilityCatalog.capabilities
            .filter { it.owner == "N01" && it.execution == Execution.LOCAL }
            .associate { capability ->
                capability.id to { payload: JSONObject ->
                    when (capability.id) {
                        "mesh.ping" -> JSONObject().put("ok", true).put("runtime", "android")
                        "files.pick", "media.pick" -> JSONObject()
                            .put("ok", true)
                            .put("runtime", "android")
                            .put("resources", payload.optJSONArray("resources") ?: org.json.JSONArray())
                        "device.camera", "device.microphone" -> JSONObject()
                            .put("ok", true)
                            .put("runtime", "android")
                            .put("permissionGate", true)
                        else -> JSONObject().put("error", "LOCAL_CAPABILITY_NOT_IMPLEMENTED").put("capability", capability.id)
                    }
                }
            }
        runtime.register("N01", SoulMeshEndpoint("N01", localHandlers) { message -> executor.execute(message) })
        return runtime
    }

    fun delegateToWeb(message: SoulMeshMessage): SoulMeshMessage =
        SoulMeshMessage(
            id = java.util.UUID.randomUUID().toString(),
            correlationId = message.correlationId,
            source = message.target,
            target = message.source,
            kind = "event",
            capability = message.capability,
            payload = JSONObject().put("execution", "WEB_SESSION").put("request", message.toJson()),
            timestamp = java.time.Instant.now().toString(),
        )
}
