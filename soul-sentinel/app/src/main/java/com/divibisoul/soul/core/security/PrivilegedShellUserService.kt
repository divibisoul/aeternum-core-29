package com.divibisoul.soul.core.security

import android.os.RemoteException
import androidx.annotation.Keep
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.nio.charset.StandardCharsets

@Keep
class PrivilegedShellUserService : IPrivilegedShell.Stub() {
    @Throws(RemoteException::class)
    override fun exec(command: String): String {
        val safeCommand = PrivilegedCommandValidator.validate(command)
        val process = ProcessBuilder("sh", "-c", safeCommand)
            .redirectErrorStream(true)
            .start()
        val output = readBounded(process.inputStream, MAX_OUTPUT_BYTES)
        val exitCode = process.waitFor()
        if (exitCode != 0) {
            val text = output.toString(StandardCharsets.UTF_8).trim()
            throw IllegalStateException(text.ifBlank { "SHIZUKU_EXIT_$exitCode" })
        }
        return output.toString(StandardCharsets.UTF_8).trim()
    }

    @Suppress("unused")
    override fun destroy() {
        System.exit(0)
    }

    private fun readBounded(input: InputStream, limit: Int): ByteArray {
        val out = ByteArrayOutputStream(minOf(limit, 16 * 1024))
        val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
        var remaining = limit
        while (remaining > 0) {
            val read = input.read(buffer, 0, minOf(buffer.size, remaining))
            if (read < 0) break
            out.write(buffer, 0, read)
            remaining -= read
        }
        return out.toByteArray()
    }

    companion object {
        private const val MAX_OUTPUT_BYTES = 256 * 1024
    }
}
