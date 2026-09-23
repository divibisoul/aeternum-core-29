package com.divibisoul.soul

import com.divibisoul.soul.network.SaraContractParser
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SaraContractParserTest {
    @Test fun parsesCycleEvidence() {
        val json = JSONObject("""
            {"cycle_id":"c1","correlation_id":"r1","converged":true,"rollback_performed":false,"trace_hash":"h1"}
        """.trimIndent())
        val result = SaraContractParser.cycle(json, "fallback")
        assertEquals("c1", result.cycleId)
        assertEquals("r1", result.correlationId)
        assertTrue(result.converged == true)
        assertEquals("h1", result.traceHash)
    }

    @Test(expected = Exception::class)
    fun rejectsMissingCycleId() {
        SaraContractParser.cycle(JSONObject("{}"), "fallback")
    }
}
