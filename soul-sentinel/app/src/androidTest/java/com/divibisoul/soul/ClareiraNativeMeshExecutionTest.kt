package com.divibisoul.soul

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ClareiraNativeMeshExecutionTest {
    @Test
    fun n01CanExecuteOwnedClareiraSnapshotLocally() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val runtime = SoulMeshBootstrap.create(androidContext = context)

        val result = runtime.send(
            "N01",
            "N01",
            "clareira.android.snapshot",
            JSONObject()
        )

        assertEquals("response", result.kind)
        assertEquals("N01", result.source)
        assertEquals("N01", result.target)
        assertEquals("clareira.android.snapshot", result.capability)
        assertTrue(result.payload.has("batteryPercent"))
        assertTrue(result.payload.has("timestamp"))
    }

    @Test
    fun n01SelfDispatchRejectsUnknownLocalCapability() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val runtime = SoulMeshBootstrap.create(androidContext = context)

        try {
            runtime.send("N01", "N01", "unknown.local", JSONObject())
        } catch (error: IllegalArgumentException) {
            assertEquals("Self-target dispatch requires a capability owned by target nucleus", error.message)
            return
        }
        throw AssertionError("unknown self-target capability was accepted")
    }
}
