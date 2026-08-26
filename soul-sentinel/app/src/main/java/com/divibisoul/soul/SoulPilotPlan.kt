package com.divibisoul.soul

import org.json.JSONArray
import org.json.JSONObject

/** Deterministic composite-task executor. Each step is routed through the same Pilot/Registry/Mesh path. */
data class SoulPlanStepResult(
    val capability: String,
    val taskId: String,
    val correlationId: String,
    val owner: String,
    val response: SoulMeshMessage,
)

class SoulPilotPlan(private val pilot: SoulPilot) {
    fun execute(capabilities: List<String>, initialPayload: JSONObject = JSONObject()): List<SoulPlanStepResult> {
        require(capabilities.isNotEmpty()) { "PLAN_EMPTY" }
        var payload = initialPayload
        val results = mutableListOf<SoulPlanStepResult>()
        capabilities.forEach { capability ->
            val task = pilot.execute(capability, payload)
            results += SoulPlanStepResult(capability, task.taskId, task.correlationId, task.owner, task.response)
            payload = JSONObject().put("previousCapability", capability).put("previousResponse", task.response.toJson())
        }
        return results
    }

    fun toJson(results: List<SoulPlanStepResult>): JSONArray = JSONArray().apply {
        results.forEach { step ->
            put(JSONObject().apply {
                put("capability", step.capability)
                put("taskId", step.taskId)
                put("correlationId", step.correlationId)
                put("owner", step.owner)
                put("response", step.response.toJson())
            })
        }
    }
}
