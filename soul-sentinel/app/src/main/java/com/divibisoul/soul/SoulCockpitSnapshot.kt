package com.divibisoul.soul

import org.json.JSONArray
import org.json.JSONObject

/** Read-only operational view. Cockpit observes the runtime; it does not execute tasks itself. */
class SoulCockpitSnapshot(
    private val pilot: SoulPilot,
    private val mesh60: SoulMesh60ConnectionMatrix,
    private val aiProviders: SoulAiProviderRegistry,
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("role", "observability")
        put("interfaceSeparated", true)
        put("pilotTasks", JSONArray().apply {
            pilot.allTasks().forEach { task ->
                put(JSONObject().apply {
                    put("taskId", task.taskId); put("capability", task.capability); put("owner", task.owner)
                    put("correlationId", task.correlationId); put("state", task.state.name); put("attempt", task.attempt)
                    task.error?.let { put("error", it) }
                })
            }
        })
        put("capabilities", pilot.registrySnapshot())
        put("aiProviders", JSONArray(aiProviders.allEnabled().map { it.id }))
        put("mesh", JSONArray().apply {
            mesh60.snapshot().forEach { channel ->
                put(JSONObject().apply {
                    put("id", channel.id); put("source", channel.source); put("target", channel.target)
                    put("configured", channel.configured); put("reachable", channel.reachable)
                    channel.correlationId?.let { put("correlationId", it) }; channel.error?.let { put("error", it) }
                    put("checkedAt", channel.checkedAt)
                })
            }
        })
    }
}
