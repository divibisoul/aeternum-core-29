package com.divibisoul.soul

import org.json.JSONObject

/** Builds the six-nucleus runtime and preserves native ownership while enabling peer routing. */
object SoulMeshBootstrap {
    fun create(
        webDelegate: (SoulMeshMessage) -> SoulMeshMessage,
        peerEndpoints: Map<String, String> = emptyMap(),
    ): SoulMeshRuntime {
        val runtime = SoulMeshRuntime()
        val remote = SoulMeshTransport(peerEndpoints)
        val executor = SoulHybridCapabilityExecutor(webDelegate, remote)

        SoulMeshChannels.nuclei.forEach { nucleus ->
            val handlers = SoulCapabilityCatalog.capabilities
                .filter { it.owner == nucleus && it.execution == Execution.LOCAL }
                .associate { capability ->
                    capability.id to { payload: JSONObject ->
                        if (capability.id == "mesh.ping") {
                            JSONObject().put("ok", true).put("runtime", "android").put("nucleus", nucleus)
                        } else {
                            JSONObject()
                                .put("error", "LOCAL_CAPABILITY_NOT_IMPLEMENTED")
                                .put("capability", capability.id)
                                .put("owner", nucleus)
                        }
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
            kind = "response",
            capability = message.capability,
            payload = JSONObject().put("execution", "WEB_SESSION").put("request", message.toJson()),
            timestamp = java.time.Instant.now().toString(),
        )
}
