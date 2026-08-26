package com.divibisoul.soul

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class SoulMeshRpcEndToEndTest {
    @Test
    fun requestReachesEndpointAndReturnsCorrelatedResponse() {
        val receiver = SoulMeshHttpTransport(sourceNucleus = "N02", port = 18767)
        val endpoint = SoulMeshEndpoint(
            nucleusId = "N02",
            handlers = mapOf("context.read" to { payload -> JSONObject().put("echo", payload.optBoolean("probe")) })
        )
        assertTrue(receiver.startWithResponse { endpoint.receive(it) }.isSuccess)
        try {
            val sender = SoulMeshTransport(mapOf("N02" to "http://127.0.0.1:18767/soul/mesh/v1"))
            val correlationId = UUID.randomUUID().toString()
            val request = SoulMeshMessage(
                id = UUID.randomUUID().toString(), correlationId = correlationId,
                source = "N01", target = "N02", kind = "request", capability = "context.read",
                payload = JSONObject().put("probe", true), timestamp = System.currentTimeMillis()
            )
            val result = runCatching { sender.send(request) }
            assertTrue(result.isSuccess)
            val response = result.getOrThrow()
            assertEquals("response", response.kind)
            assertEquals(correlationId, response.correlationId)
            assertEquals("N02", response.source)
            assertEquals("N01", response.target)
            assertTrue(response.payload.optBoolean("echo"))
        } finally { receiver.stop() }
    }
}
