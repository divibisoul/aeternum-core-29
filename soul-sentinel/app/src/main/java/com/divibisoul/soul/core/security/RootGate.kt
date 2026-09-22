package com.divibisoul.soul.core.security

import java.io.BufferedReader
import java.io.InputStreamReader

class RootUnavailableException(message: String = "ROOT_UNAVAILABLE") : Exception(message)

data class RootStatus(
    val available: Boolean,
    val selinuxEnforcing: Boolean?,
    val magiskPresent: Boolean
)

class RootGate {
    private val allowed = setOf("id", "getenforce", "dumpsys", "pm", "am", "settings", "top", "logcat")

    fun status(): RootStatus {
        val root = runSu("id").getOrNull()?.contains("uid=0") == true
        val selinux = runSu("getenforce").getOrNull()?.contains("Enforcing", true)
        val magisk = runSu("command -v magisk").isSuccess
        return RootStatus(root, selinux, magisk)
    }

    fun execute(command: String): String {
        val binary = command.trim().split(Regex("\s+")).firstOrNull().orEmpty()
        if (binary !in allowed) throw SecurityException("ROOT_COMMAND_NOT_ALLOWED:$binary")
        return runSu(command).getOrElse { throw RootUnavailableException() }
    }

    fun snapshot(command: String): String? = runCatching { execute(command) }.getOrNull()

    private fun runSu(command: String): Result<String> = runCatching {
        val process = ProcessBuilder("su", "-c", command).redirectErrorStream(true).start()
        val output = BufferedReader(InputStreamReader(process.inputStream)).readText().trim()
        val code = process.waitFor()
        if (code != 0) error(output.ifBlank { "SU_EXIT_$code" })
        output
    }
}
