package com.divibisoul.soul

import com.divibisoul.soul.core.federation.FederatedOwnershipRegistry
import com.divibisoul.soul.core.federation.FederationNode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class FederatedOwnershipRegistryTest {
    @Test fun containsSevenNucleiPlusSara() {
        assertEquals(8, FederationNode.entries.size)
        assertTrue(FederatedOwnershipRegistry.routes.any { it.owner == FederationNode.N01 })
        assertTrue(FederatedOwnershipRegistry.routes.any { it.owner == FederationNode.N06 })
        assertTrue(FederatedOwnershipRegistry.routes.any { it.owner == FederationNode.N07 })
        assertTrue(FederatedOwnershipRegistry.routes.any { it.owner == FederationNode.SARA })
    }
}
