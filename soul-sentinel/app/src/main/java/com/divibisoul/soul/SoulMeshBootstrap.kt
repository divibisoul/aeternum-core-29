package com.divibisoul.soul

import org.json.JSONObject

/** Builds the six nuclei and binds capabilities to local, WebView, or remote execution. */
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
                        val request = SoulMeshMessage(
                            id = "local-${capability.id}",
                            correlationId = "local-${capability.id}",
                            source = nucleus,
                            target = nucleus,
                            kind = "request",
                            capability = capability.id,
                            payload = payload,
                            timestamp = java.time.Instant.now().toString(),
                        )
                        executor.execute(request).payload
                    }
                }
            runtime.register(nucleus, SoulMeshEndpoint(nucleus, handlers))
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
