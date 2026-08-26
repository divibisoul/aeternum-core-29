package com.divibisoul.soul

import org.json.JSONObject

/** Recovery policy for hybrid execution: bounded retry, then capability fallback. */
class SoulPilotRecovery(private val pilot: SoulPilot) {
    fun executeWithFallback(capabilities: List<String>, payload: JSONObject, retriesPerCapability: Int = 1): SoulPilot.Task {
        require(capabilities.isNotEmpty()) { "RECOVERY_NO_CAPABILITIES" }
        require(retriesPerCapability >= 0) { "RECOVERY_INVALID_RETRY_COUNT" }
        var last: SoulPilot.Task? = null
        for (capability in capabilities) {
            var task = pilot.execute(capability, payload)
            var retries = 0
            while (task.state == SoulPilot.TaskState.FAILED && retries < retriesPerCapability) {
                task = pilot.retry(task.taskId)
                retries++
            }
            if (task.state == SoulPilot.TaskState.SUCCEEDED) return task
            last = task
        }
        return last ?: error("RECOVERY_NO_RESULT")
    }
}
