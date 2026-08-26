package com.divibisoul.soul

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SoulHybridMeshTest {
    private val context: Context = ApplicationProvider.getApplicationContext()

    @Test
    fun bootstrapRegistersOnlyTheRealN01Endpoint() {
        val mesh = SoulMeshBootstrap.create(context) { SoulMeshBootstrap.delegateToWeb(it) }
        assertEquals(setOf("N01"), mesh.registeredNuclei())
        assertFalse(mesh.allNucleiRegistered())
        val response = mesh.send("N02", "N01", "mesh.health", JSONObject())
        assertEquals("response", response.kind)
        assertEquals("N01", response.source)
        assertEquals("N02", response.target)
    }

    @Test
    fun remotePeerRequiresRealTransportConfiguration() {
        val mesh = SoulMeshBootstrap.create(context) { SoulMeshBootstrap.delegateToWeb(it) }
        val failure = runCatching {
            mesh.send("N01", "N02", "mesh.health", JSONObject())
        }.exceptionOrNull()
        assertTrue(failure != null)
        assertTrue(failure!!.message!!.contains("not registered") || failure.message!!.contains("No transport endpoint"))
    }
}
