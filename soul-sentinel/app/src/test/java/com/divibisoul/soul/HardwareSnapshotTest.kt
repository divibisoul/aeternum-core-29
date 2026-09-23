package com.divibisoul.soul

import com.divibisoul.soul.core.hardware.HardwareSnapshot
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class HardwareSnapshotTest {
    @Test fun snapshotPreservesUnknownHardwareValues() {
        val snapshot = HardwareSnapshot(
            manufacturer = "unknown",
            model = "unknown",
            soc = null,
            cpuCores = 8,
            apiLevel = 36,
            hasNpu = null,
            nnapiAvailable = false,
            thermalZones = emptyList(),
            batteryTempC = null,
            batteryLevel = null
        )
        assertEquals(8, snapshot.cpuCores)
        assertNull(snapshot.soc)
        assertNull(snapshot.batteryLevel)
        assertNull(snapshot.hasNpu)
        assertEquals(false, snapshot.nnapiAvailable)
    }
}
