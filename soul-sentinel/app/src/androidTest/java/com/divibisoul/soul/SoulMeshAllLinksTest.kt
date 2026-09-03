package com.divibisoul.soul

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** Proves the complete seven-nucleus directed matrix through the APK's in-process runtime. */
class SoulMeshAllLinksTest {
    @Test
    fun allFortyTwoDirectedLinksRoundTrip() {
        val runtime = SoulMeshRuntime()
        SoulMeshChannels.nuclei.forEach { nucleus ->
            runtime.register(
                nucleus,
                SoulMeshEndpoint(
                    nucleusId = nucleus,
                    handlers = mapOf("mesh.ping" to { payload -> JSONObject(payload.toString()).put("servedBy", nucleus) }),
                ),
            )
        }

        assertTrue(runtime.allNucleiRegistered())
        val links = SoulMeshChannels.directedLinks()
        assertEquals(42, links.size)
        assertEquals(21, SoulMeshChannels.bidirectionalPairs().size)

        links.forEach { (source, target) ->
            val response = runtime.send(
                source = source,
                target = target,
                capability = "mesh.ping",
                payload = JSONObject().put("source", source),
            )
            assertEquals("response", response.kind)
            assertEquals(source, response.target)
            assertEquals(target, response.source)
            assertEquals("mesh.ping", response.capability)
            assertEquals(target, response.payload.getString("servedBy"))
        }
    }

    @Test
    fun sentinelMeshIntegrityContractRemainsClosed() {
        assertEquals(7, SoulMeshChannels.nuclei.size)
        SoulMeshChannels.nuclei.forEach { nucleus ->
            assertEquals(6, SoulMeshChannels.out(nucleus).size)
            assertEquals(6, SoulMeshChannels.input(nucleus).size)
        }
        assertEquals(42, SoulMeshChannels.directedLinks().size)
        assertEquals(21, SoulMeshChannels.bidirectionalPairs().size)
    }
}
