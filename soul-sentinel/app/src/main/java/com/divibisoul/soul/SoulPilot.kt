package com.divibisoul.soul

import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/** Native orchestration layer. UI and Cockpit remain separate from execution. */
class SoulPilot(
    val registry: SoulCapabilityRegistry,
    private val mesh: SoulMeshRuntime,
) {
    enum class TaskState { RUNNING, SUCCEEDED, FAILED }

    data class Task(
        val taskId: String,
        val capability: String,
        val owner: String,
        val correlationId: String,
        val request: SoulMeshMessage,
        val response: SoulMeshMessage,
        val state: TaskState,
        val error: String? = null,
        val attempt: Int = 1,
    )

    private val tasks = ConcurrentHashMap<String, Task>()

    fun execute(capabilityId: String, payload: JSONObject, attempt: Int = 1): Task {
        val capability = registry.resolve(capabilityId)
            ?: error("CAPABILITY_NOT_REGISTERED: $capabilityId")
        val requestCorrelation = UUID.randomUUID().toString()
        val request = SoulMeshMessage(
            id = UUID.randomUUID().toString(),
            correlationId = requestCorrelation,
            source = "N01",
            target = capability.owner,
            kind = "request",
            capability = capability.id,
            payload = payload,
            timestamp = java.time.Instant.now().toString(),
        )

        return try {
            val response = mesh.send(request.source, request.target, request.capability, request.payload)
            val state = if (response.kind == "error") TaskState.FAILED else TaskState.SUCCEEDED
            val task = Task(UUID.randomUUID().toString(), capability.id, capability.owner, response.correlationId, request, response, state, null, attempt)
            tasks[task.taskId] = task
            task
        } catch (error: Throwable) {
            val failure = SoulMeshMessage(
                id = UUID.randomUUID().toString(), correlationId = request.correlationId,
                source = capability.owner, target = request.source, kind = "error",
                capability = capability.id,
                payload = JSONObject().put("error", error.message ?: error::class.java.simpleName),
                timestamp = java.time.Instant.now().toString(),
            )
            val task = Task(UUID.randomUUID().toString(), capability.id, capability.owner, request.correlationId, request, failure, TaskState.FAILED, error.message, attempt)
            tasks[task.taskId] = task
            task
        }
    }

    fun retry(taskId: String): Task {
        val previous = tasks[taskId] ?: error("TASK_NOT_FOUND: $taskId")
        return execute(previous.capability, previous.request.payload, previous.attempt + 1)
    }

    fun task(taskId: String): Task? = tasks[taskId]
    fun activeTasks(): List<Task> = tasks.values.toList().filter { it.state == TaskState.RUNNING }
    fun allTasks(): List<Task> = tasks.values.toList()
    fun registrySnapshot(): JSONObject = registry.toJson()
}
