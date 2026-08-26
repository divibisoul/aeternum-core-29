package com.divibisoul.soul

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SoulCoreContractTest {
    @Test
    fun mesh_has_six_nuclei_with_five_in_and_five_out() {
        assertEquals(6, SoulMeshChannels.nuclei.size)
        SoulMeshChannels.nuclei.forEach { nucleus ->
            assertEquals(5, SoulMeshChannels.out(nucleus).size)
            assertEquals(5, SoulMeshChannels.input(nucleus).size)
        }
        assertEquals(30, SoulMeshChannels.directedLinks().size)
        assertEquals(15, SoulMeshChannels.bidirectionalPairs().size)
    }

    @Test
    fun registry_matches_catalog() {
        val registry = SoulCapabilityRegistry()
        assertTrue(registry.isReady())
        assertEquals(SoulCapabilityCatalog.capabilities.size, registry.all().size)
        SoulCapabilityCatalog.capabilities.forEach { catalog ->
            assertEquals(catalog.owner, registry.resolve(catalog.id)?.owner)
        }
    }

    @Test
    fun remote_capability_requires_web_session() {
        val registry = SoulCapabilityRegistry()
        val webCapabilities = registry.all().filter { it.transport == "web-session" }
        assertTrue(webCapabilities.isNotEmpty())
        assertTrue(webCapabilities.all { it.requiresAi })
    }
}
