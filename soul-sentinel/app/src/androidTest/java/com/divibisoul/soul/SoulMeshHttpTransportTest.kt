package com.divibisoul.soul

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class SoulMeshHttpTransportTest {
    @Test
    fun loopbackRequestReachesReceiverAndReturnsCanonicalResponse() {
        val received = CountDownLatch(1)
        var receivedMessage: SoulMeshMessage? = null
        val receiver = SoulMeshHttpTransport(sourceNucleus = "N02", port = 18765)
        assertTrue(receiver.start {
            receivedMessage = it
            received.countDown()
        }.isSuccess)

        try {
            val sender = SoulMeshHttpTransport(sourceNucleus = "N01")
            val correlationId = UUID.randomUUID().toString()
            val message = SoulMeshMessage(
                id = UUID.randomUUID().toString(),
                correlationId = correlationId,
                source = "N01",
                target = "N02",
                kind = "request",
                capability = "context.read",
                payload = JSONObject().put("probe", true).put("message", "consciência 🧠"),
                timestamp = System.currentTimeMillis(),
            )

            val result = sender.send("http://127.0.0.1:18765/soul/mesh/v1", message)
            assertTrue("Loopback Mesh HTTP failed: ${result.exceptionOrNull()?.message}", result.isSuccess)
            val response = result.getOrThrow()
            assertEquals("response", response.kind)
            assertEquals(correlationId, response.correlationId)
            assertEquals("N02", response.source)
            assertEquals("N01", response.target)
            assertTrue(received.await(2, TimeUnit.SECONDS))
            assertEquals(correlationId, receivedMessage?.correlationId)
            assertEquals("consciência 🧠", receivedMessage?.payload?.optString("message"))
            assertEquals("N01", receivedMessage?.source)
            assertEquals("N02", receivedMessage?.target)
        } finally {
            receiver.stop()
        }
    }

    @Test
    fun malformedMessageIsRejectedBeforeDispatch() {
        val receiver = SoulMeshHttpTransport(sourceNucleus = "N02", port = 18766)
        val dispatched = CountDownLatch(1)
        assertTrue(receiver.start { dispatched.countDown() }.isSuccess)
        try {
            val sender = SoulMeshHttpTransport(sourceNucleus = "N01")
            val malformed = SoulMeshMessage(
                id = UUID.randomUUID().toString(),
                correlationId = UUID.randomUUID().toString(),
                source = "INVALID",
                target = "N02",
                kind = "request",
                capability = "context.read",
                payload = JSONObject(),
                timestamp = System.currentTimeMillis(),
            )
            val result = sender.send("http://127.0.0.1:18766/soul/mesh/v1", malformed)
            assertTrue(result.isFailure)
            assertTrue(!dispatched.await(500, TimeUnit.MILLISECONDS))
        } finally {
            receiver.stop()
        }
    }
}
