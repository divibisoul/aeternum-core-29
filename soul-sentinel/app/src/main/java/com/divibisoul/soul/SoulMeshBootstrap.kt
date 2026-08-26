package com.divibisoul.soul

import org.json.JSONObject

/** Builds the six nuclei and binds every capability to the correct execution mode. */
object SoulMeshBootstrap {
    fun create(webDelegate: (SoulMeshMessage) -> SoulMeshMessage): SoulMeshRuntime {
        val runtime = SoulMeshRuntime()
        val remote = SoulMeshTransport(emptyMap())
        val executor = SoulHybridCapabilityExecutor(webDelegate, remote)

        SoulMeshChannels.nuclei.forEach { nucleus ->
            val handlers = SoulCapabilityCatalog.capabilities
                .filter { it.owner == nucleus && it.execution == Execution.LOCAL }
                .associate { capability ->
                    capability.id to { payload: JSONObject ->
                        if (capability.id == "mesh.ping") JSONObject().put("ok", true).put("runtime", "android")
                        else JSONObject().put("error", "LOCAL_CAPABILITY_NOT_IMPLEMENTED").put("capability", capability.id)
                    }
                }
            runtime.register(nucleus, SoulMeshEndpoint(nucleus, handlers) { message -> executor.execute(message) })
        }
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
