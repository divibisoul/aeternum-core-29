package com.divibisoul.soul

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import org.json.JSONObject

/** Parallel execution layer for independent capabilities; shared Mesh remains the transport boundary. */
class SoulExecutionScheduler(private val pilot: SoulPilot) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    fun executeParallel(capabilities: List<String>, payload: JSONObject = JSONObject(), onComplete: (List<SoulPilot.Task>) -> Unit) {
        require(capabilities.isNotEmpty()) { "PARALLEL_PLAN_EMPTY" }
        scope.async {
            coroutineScope {
                capabilities.map { capability -> async(Dispatchers.Default) { pilot.execute(capability, payload) } }.awaitAll()
            }
        }.invokeOnCompletion { cause ->
            if (cause == null) {
                scope.async(Dispatchers.Default) {
                    capabilities.map { capability -> pilot.allTasks().lastOrNull { it.capability == capability } }
                        .filterNotNull()
                }.invokeOnCompletion { }
            }
        }
        scope.async(Dispatchers.Default) {
            val tasks = coroutineScope {
                capabilities.map { capability -> async(Dispatchers.Default) { pilot.execute(capability, payload) } }.awaitAll()
            }
            onComplete(tasks)
        }
    }
}
