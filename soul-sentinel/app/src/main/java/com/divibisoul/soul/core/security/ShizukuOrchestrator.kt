package com.divibisoul.soul.core.security

import android.content.pm.PackageManager
import rikka.shizuku.Shizuku
import java.io.BufferedReader
import java.io.InputStreamReader

data class ShizukuState(
    val running: Boolean,
    val permissionGranted: Boolean,
    val apiVersion: Int
)

class ShizukuOrchestrator {
    companion object {
        const val PERMISSION_REQUEST_CODE = 7401
    }

    private val allowed = setOf("id", "dumpsys", "pm", "am", "settings", "top", "logcat")

    fun state(): ShizukuState = runCatching {
        val running = Shizuku.pingBinder()
        val permission = running &&
            Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
        ShizukuState(running, permission, Shizuku.getVersion())
    }.getOrElse { ShizukuState(false, false, -1) }

    fun requestPermissionIfNeeded() {
        val s = state()
        if (s.running && !s.permissionGranted) {
            Shizuku.requestPermission(PERMISSION_REQUEST_CODE)
        }
    }

    fun execute(command: String): String {
        val binary = command.trim().split(Regex("\s+")).firstOrNull().orEmpty()
        if (binary !in allowed) throw SecurityException("SHIZUKU_COMMAND_NOT_ALLOWED:" + binary)
        val s = state()
        if (!s.running) throw RootUnavailableException("SHIZUKU_UNAVAILABLE")
        if (!s.permissionGranted) throw SecurityException("SHIZUKU_PERMISSION_REQUIRED")

        val process = Shizuku.newProcess(arrayOf("sh", "-c", command), null, null)
        val output = BufferedReader(InputStreamReader(process.inputStream)).readText().trim()
        val error = BufferedReader(InputStreamReader(process.errorStream)).readText().trim()
        val code = process.waitFor()
        if (code != 0) throw IllegalStateException(error.ifBlank { "SHIZUKU_EXIT_" + code })
        return output
    }
}
