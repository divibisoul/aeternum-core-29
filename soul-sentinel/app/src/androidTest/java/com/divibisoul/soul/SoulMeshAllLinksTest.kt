package com.divibisoul.soul

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** Verifies the logical 5x5 peer matrix without mislabeling it as live connectivity. */
class SoulMeshAllLinksTest {
    @Test
    fun logicalMatrixContainsThirtyDirectedLinks() {
        val links = SoulMeshChannels.directedLinks()
        assertEquals(30, links.size)
        assertTrue(links.all { (source, target) -> source != target })
        assertEquals(SoulMeshChannels.nuclei.toSet(), links.flatMap { listOf(it.first, it.second) }.toSet())
    }
}
