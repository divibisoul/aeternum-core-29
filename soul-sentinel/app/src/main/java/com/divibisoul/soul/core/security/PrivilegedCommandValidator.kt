package com.divibisoul.soul.core.security

/**
 * Shared validation for privileged shell commands.
 *
 * Privileged channels execute through a shell process, so command
 * chaining, redirection and substitution are rejected before allow-list check.
 */
object PrivilegedCommandValidator {
    private val allowed = setOf(
        "id", "getenforce", "dumpsys", "pm", "am", "settings", "top", "logcat"
    )

    fun validate(command: String): String {
        val trimmed = command.trim()
        if (trimmed.isEmpty()) throw SecurityException("PRIVILEGED_COMMAND_EMPTY")
        if (trimmed.length > 512) throw SecurityException("PRIVILEGED_COMMAND_TOO_LONG")
        if (Regex("[;&|<>`$(){}\\n\\r\\u0000]").containsMatchIn(trimmed)) {
            throw SecurityException("PRIVILEGED_COMMAND_SHELL_SYNTAX_BLOCKED")
        }
        val binary = trimmed.split(Regex("\\s+")).firstOrNull().orEmpty()
        if (binary !in allowed) {
            throw SecurityException("PRIVILEGED_COMMAND_NOT_ALLOWED:" + binary)
        }
        return trimmed
    }
}
