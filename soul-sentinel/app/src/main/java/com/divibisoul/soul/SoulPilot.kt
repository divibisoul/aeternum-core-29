package com.divibisoul.soul

import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Lightweight execution planner for N01. The Pilot resolves a capability to its
 * owning nucleus, dispatches through the real Mesh runtime, and retains correlated results.
 * UI and Cockpit remain separate from orchestration.
 */
class SoulPilot(
    private val registry: SoulCapabilityRegistry,
    private val mesh: SoulMeshRuntime,
) {
    data class Task(
        val taskId: String,
        val capability: String,
        val owner: String,
        val correlationId: String,
        val request: SoulMeshMessage,
        val response: SoulMeshMessage,
    )

    private val tasks = ConcurrentHashMap<String, Task>()

    fun execute(capabilityId: String, payload: JSONObject): Task {
        val capability = registry.resolve(capabilityId)
            ?: error("CAPABILITY_NOT_REGISTERED: $capabilityId")
        val response = mesh.send("N01", capability.owner, capability.id, payload)
        val task = Task(
            taskId = UUID.randomUUID().toString(),
            capability = capability.id,
            owner = capability.owner,
            correlationId = response.correlationId,
            request = SoulMeshMessage(
                id = response.id,
                correlationId = response.correlationId,
                source = "N01",
                target = capability.owner,
                kind = "request",
                capability = capability.id,
                payload = payload,
                timestamp = response.timestamp,
            ),
            response = response,
        )
        tasks[task.taskId] = task
        return task
    }

    fun task(taskId: String): Task? = tasks[taskId]
    fun activeTasks(): List<Task> = tasks.values.toList()
}
