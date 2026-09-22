package com.divibisoul.soul

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ClareiraAndroidCapabilitiesTest {
    @Test
    fun snapshotReturnsObservedDeviceState() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val result = ClareiraAndroidCapabilities(context).execute(
            "clareira.android.snapshot",
            JSONObject()
        )

        assertTrue(result.has("batteryPercent"))
        assertTrue(result.has("charging"))
        assertTrue(result.has("screenOn"))
        assertTrue(result.has("network"))
        assertTrue(result.has("shizukuStatus"))
        assertTrue(result.has("cpuFreqMhz"))
        assertTrue(result.has("ramUsedMb"))
        assertTrue(result.has("ramTotalMb"))
        assertTrue(result.has("foregroundPackage"))
        assertTrue(result.has("wifiEnabled"))
        assertTrue(result.has("bluetoothEnabled"))
        assertTrue(result.has("timestamp"))
        assertTrue(result.getLong("timestamp") > 0)
    }

    @Test
    fun brightnessRejectsInvalidRange() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        try {
            ClareiraAndroidCapabilities(context).execute(
                "clareira.android.brightness",
                JSONObject().put("percent", 0)
            )
        } catch (error: IllegalArgumentException) {
            assertEquals("BRIGHTNESS_PERCENT_INVALID", error.message)
            return
        }
        throw AssertionError("invalid brightness range was accepted")
    }
}
