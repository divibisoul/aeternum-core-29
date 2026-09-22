package com.divibisoul.soul.network

import org.json.JSONObject

object SaraContractParser {
    fun cycle(result: JSONObject, correlationId: String): SaraCycleResult {
        val id = result.optString("cycle_id").takeIf(String::isNotBlank)
            ?: throw SaraException("SARA_INVALID_RESPONSE", "cycle_id missing")
        return SaraCycleResult(
            cycleId = id,
            correlationId = result.optString("correlation_id", correlationId),
            converged = if (result.has("converged") && !result.isNull("converged")) result.optBoolean("converged") else null,
            rollbackPerformed = if (result.has("rollback_performed") && !result.isNull("rollback_performed")) result.optBoolean("rollback_performed") else null,
            traceHash = result.optString("trace_hash").takeIf(String::isNotBlank)
        )
    }
}
