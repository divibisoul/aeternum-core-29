package com.divibisoul.soul

import android.content.Context
import org.json.JSONObject

/**
 * Builds the N01 side of the hybrid Mesh.
 *
 * Important: remote nuclei are NOT registered as fake local endpoints. They
 * become reachable only when a real transport endpoint is configured.
 */
object SoulMeshBootstrap {
    fun create(
        context: Context,
        webDelegate: (SoulMeshMessage) -> SoulMeshMessage,
        authorize: (capability: String, payload: JSONObject) -> Boolean = { _, _ -> false },
    ): SoulMeshRuntime {
        val config = SoulConfig(context)
        val remoteEndpoints = SoulMeshContract.nucleusIds
            .filter { it != "N01" }
            .mapNotNull { nucleus -> config.meshEndpoint(nucleus)?.let { nucleus to it } }
            .toMap()
        val remote = SoulMeshTransport(remoteEndpoints)
        val executor = SoulHybridCapabilityExecutor(context, webDelegate, remote, authorize)
        val runtime = SoulMeshRuntime(remote = remote)

        val handlers = SoulCapabilityCatalog.ownedBy("N01")
            .filter { it.execution == Execution.LOCAL }
            .associate { capability ->
                capability.id to { payload: JSONObject ->
                    val request = SoulMeshMessage(
                        id = java.util.UUID.randomUUID().toString(),
                        correlationId = java.util.UUID.randomUUID().toString(),
                        source = "N02",
                        target = "N01",
                        kind = "request",
                        capability = capability.id,
                        payload = payload,
                        timestamp = java.time.Instant.now().toString(),
                    )
                    val result = executor.execute(request)
                    if (result.kind == "error") throw IllegalStateException(result.payload.toString())
                    result.payload
                }
            }

        runtime.register("N01", SoulMeshEndpoint("N01", handlers) { message -> executor.execute(message) })
        return runtime
    }

    /** Backward-compatible factory for callers that do not yet provide Context. */
    fun create(webDelegate: (SoulMeshMessage) -> SoulMeshMessage): SoulMeshRuntime =
        error("N01 Mesh bootstrap now requires Android Context so remote endpoints and native capabilities are explicit")

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
