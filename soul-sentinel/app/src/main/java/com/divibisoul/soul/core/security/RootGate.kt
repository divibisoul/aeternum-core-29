package com.divibisoul.soul.core.security

import com.topjohnwu.superuser.Shell

class RootUnavailableException(message: String = "ROOT_UNAVAILABLE") : Exception(message)

data class RootStatus(
    val available: Boolean,
    val selinuxEnforcing: Boolean?,
    val magiskPresent: Boolean
)

class RootGate {
    private val allowed = setOf("id", "getenforce", "dumpsys", "pm", "am", "settings", "top", "logcat")

    fun status(): RootStatus {
        val cachedRoot = Shell.getCachedShell()?.isRoot == true
        val granted = Shell.isAppGrantedRoot() == true
        val root = cachedRoot || granted
        val selinux = runLibsu("getenforce").getOrNull()?.contains("Enforcing", true)
        val magisk = runLibsu("command -v magisk").isSuccess
        return RootStatus(root, selinux, magisk)
    }

    fun execute(command: String): String {
        val binary = command.trim().split(Regex("\s+")).firstOrNull().orEmpty()
        if (binary !in allowed) throw SecurityException("ROOT_COMMAND_NOT_ALLOWED:" + binary)
        val shell = runCatching { Shell.getShell() }.getOrElse {
            throw RootUnavailableException(it.message ?: "ROOT_UNAVAILABLE")
        }
        if (!shell.isRoot) throw RootUnavailableException()
        val result = Shell.cmd(command).exec()
        if (!result.isSuccess) throw IllegalStateException(
            result.getErr().joinToString("\n").ifBlank { "ROOT_COMMAND_FAILED" }
        )
        return result.getOut().joinToString("\n")
    }

    fun snapshot(command: String): String? = runCatching { execute(command) }.getOrNull()

    private fun runLibsu(command: String): Result<String> = runCatching {
        val result = Shell.cmd(command).exec()
        if (!result.isSuccess) error(result.getErr().joinToString("\n").ifBlank { "COMMAND_FAILED" })
        result.getOut().joinToString("\n").trim()
    }
}
