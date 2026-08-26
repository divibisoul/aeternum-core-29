package com.divibisoul.soul

import org.json.JSONObject

/** Builds the six logical nuclei inside the single APK process. */
object SoulMeshBootstrap {
    fun create(): SoulMeshRuntime {
        val runtime = SoulMeshRuntime()
        SoulMeshChannels.nuclei.forEach { nucleus ->
            val handlers = SoulCapabilityCatalog.capabilities
                .filter { it.owner == nucleus }
                .associate { capability ->
                    capability.id to { payload: JSONObject ->
                        JSONObject()
                            .put("capability", capability.id)
                            .put("execution", capability.execution.name)
                            .put("nucleus", nucleus)
                            .put("accepted", true)
                            .put("payload", payload)
                    }
                }
            runtime.register(nucleus, SoulMeshEndpoint(nucleus, handlers))
        }
        return runtime
    }
}
