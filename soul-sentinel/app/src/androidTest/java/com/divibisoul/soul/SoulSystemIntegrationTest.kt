package com.divibisoul.soul

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SoulSystemIntegrationTest {
    private fun createPingOnlyRuntime(): SoulMeshRuntime =
        SoulMeshBootstrap.create(
            webDelegate = {
                throw AssertionError("Unexpected web delegation during Mesh ping-only verification")
            },
        )

    @Test
    fun bootstrapRegistersAllSixNuclei() {
        val runtime = createPingOnlyRuntime()
        assertEquals(setOf("N01", "N02", "N03", "N04", "N05", "N06"), runtime.registeredNuclei())
    }

    @Test
    fun completeDirectedMatrixResponds() {
        val runtime = createPingOnlyRuntime()
        SoulMeshChannels.directedLinks().forEach { (source, target) ->
            val result = runtime.send(source, target, "mesh.ping", JSONObject().put("source", source))
            assertEquals("response", result.kind)
            assertEquals(source, result.target)
            assertEquals(target, result.source)
            assertTrue(result.correlationId.isNotBlank())
        }
    }
}
