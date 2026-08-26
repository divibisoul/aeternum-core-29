package com.divibisoul.soul

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SoulHybridChannelTopologyTest {
    @Test
    fun everyNucleusHasFiveInAndFiveOut() {
        SoulHybridTopology.nuclei.forEach { nucleus ->
            val channels = SoulHybridTopology.channels(nucleus)
            assertEquals(10, channels.size)
            assertEquals(5, channels.count { it.direction == SoulHybridChannel.Direction.OUT })
            assertEquals(5, channels.count { it.direction == SoulHybridChannel.Direction.IN })
        }
    }

    @Test
    fun completeFabricContainsSixtyDirectionalChannels() {
        val channels = SoulHybridTopology.allChannels()
        assertEquals(60, channels.size)
        assertEquals(60, channels.map { it.id }.toSet().size)
        assertTrue(channels.all { it.transports.size == 5 })
    }
}
