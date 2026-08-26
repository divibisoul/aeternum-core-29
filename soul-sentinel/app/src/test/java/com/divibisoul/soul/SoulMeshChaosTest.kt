package com.divibisoul.soul

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test

class SoulMeshChaosTest {
    @Test fun invalidCapabilityFailsClosed() {
        val runtime = SoulMeshRuntime(remote = SoulMeshTransport(emptyMap()))
        val result = runCatching { runtime.send("N01", "N06", "missing.capability", JSONObject()) }
        assertEquals(true, result.isFailure)
    }

    @Test fun malformedMessageIsRejected() {
        val result = runCatching { SoulMeshMessage.fromJson(JSONObject().put("protocol", "wrong")) }
        assertEquals(true, result.isFailure)
    }

    @Test fun missingRemoteEndpointIsObservable() {
        val transporter = SoulHttpMeshTransporter(emptyMap())
        val message = SoulMeshMessage(
            id = "chaos-id", correlationId = "chaos-correlation", source = "N01", target = "N02",
            kind = "request", capability = "mesh.ping", payload = JSONObject(), timestamp = "2026-08-26T00:00:00Z",
        )
        val result = runCatching { transporter.send(message) }
        assertNotNull(result.exceptionOrNull())
    }
}
