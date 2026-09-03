package com.divibisoul.soul

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SoulSystemIntegrationTest {
    @Test
    fun bootstrapRegistersAllSevenNuclei() {
        val runtime = SoulMeshBootstrap.create()
        assertEquals(setOf("N01", "N02", "N03", "N04", "N05", "N06", "N07"), runtime.registeredNuclei())
    }

    @Test
    fun completeDirectedMatrixResponds() {
        val runtime = SoulMeshBootstrap.create()
        SoulMeshChannels.directedLinks().forEach { (source, target) ->
            val result = runtime.send(source, target, "mesh.ping", JSONObject().put("source", source))
            assertEquals("response", result.kind)
            assertEquals(source, result.target)
            assertEquals(target, result.source)
            assertTrue(result.correlationId.isNotBlank())
        }
    }

    @Test
    fun sentinelIsEnabledByDefault() {
        val config = SoulConfig(SoulTestContext.create())
        assertTrue(config.enabled)
        assertTrue(config.checkIntervalMs > 0)
    }
}
