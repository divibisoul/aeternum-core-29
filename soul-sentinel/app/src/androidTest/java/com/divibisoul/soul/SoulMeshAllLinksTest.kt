package com.divibisoul.soul

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** Proves the active six-nucleus directed matrix through the APK's in-process runtime. */
class SoulMeshAllLinksTest {
    @Test
    fun allThirtyDirectedLinksRoundTrip() {
        val runtime = SoulMeshRuntime()
        SoulMeshChannels.nuclei.forEach { nucleus ->
            runtime.register(
                nucleus,
                SoulMeshEndpoint(
                    nucleusId = nucleus,
                    handlers = mapOf("mesh.ping" to { payload ->
                        JSONObject(payload.toString()).put("servedBy", nucleus)
                    }),
                ),
            )
        }

        assertTrue(runtime.allNucleiRegistered())
        val links = SoulMeshChannels.directedLinks()
        assertEquals(30, links.size)

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
    fun sixtySurfaceCatalogKeepsN07Structural() {
        assertEquals(listOf("N01", "N02", "N03", "N04", "N05", "N06"), SoulMeshChannels.nuclei)
        assertEquals(listOf("N07"), SoulMeshChannels.structuralNuclei)
        assertTrue("The wire contract must retain the N07 identity", "N07" in SoulMeshContract.nucleusIds)
        assertEquals(15, SoulMeshChannels.bidirectionalPairs().size)
        assertEquals(30, SoulMeshChannels.directedLinks().size)

        val channelIds = SoulMesh60ChannelAccess(emptyMap()).allChannelIds()
        assertEquals(60, channelIds.size)
        assertEquals(60, channelIds.toSet().size)
        assertEquals(30, channelIds.count { it.split('.')[1] == "OUT" })
        assertEquals(30, channelIds.count { it.split('.')[1] == "IN" })

        SoulMeshChannels.directedLinks().forEach { (source, target) ->
            val outSlot = SoulMeshChannels.out(source).indexOf(target) + 1
            val inSlot = SoulMeshChannels.input(target).indexOf(source) + 1
            assertTrue("$source OUT surface is missing", "$source.OUT.$outSlot.$target" in channelIds)
            assertTrue("$target IN surface is missing", "$target.IN.$inSlot.$source" in channelIds)
        }
    }

    @Test
    fun localProbeNeverReportsUnownedSurfacesAsReachable() {
        val results = SoulMesh60ChannelAccess(emptyMap(), sourceNucleus = "N01").probeAll()

        assertEquals(60, results.size)
        assertTrue("An unconfigured endpoint must never be reported reachable", results.all { !it.reachable })
        assertTrue(results.any { it.error == "PEER_ENDPOINT_NOT_CONFIGURED" })
        assertTrue(results.any { it.error == "SURFACE_NOT_PROBEABLE_FROM_N01" })
    }
}
