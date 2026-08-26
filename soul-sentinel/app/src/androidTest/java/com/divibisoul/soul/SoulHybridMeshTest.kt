package com.divibisoul.soul

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SoulHybridMeshTest {
    @Test
    fun allThirtyDirectedLinksRespondToPing() {
        val mesh = SoulMeshBootstrap.create { SoulMeshBootstrap.delegateToWeb(it) }
        for (source in SoulMeshChannels.nuclei) {
            for (target in SoulMeshChannels.out(source)) {
                val response = mesh.send(source, target, "mesh.ping", JSONObject())
                assertEquals("response", response.kind)
                assertEquals(source, response.target)
                assertEquals(target, response.source)
                assertEquals("mesh.ping", response.capability)
            }
        }
    }

    @Test
    fun webSessionCapabilityIsDelegatedToHybridRuntime() {
        val mesh = SoulMeshBootstrap.create { SoulMeshBootstrap.delegateToWeb(it) }
        val response = mesh.send("N01", "N02", "chat.orchestrate", JSONObject().put("text", "ping"))
        assertEquals("event", response.kind)
        assertEquals("WEB_SESSION", response.payload.getString("execution"))
        assertTrue(response.correlationId.isNotBlank())
    }
}
