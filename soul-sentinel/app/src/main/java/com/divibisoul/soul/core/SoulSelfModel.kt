package com.divibisoul.soul.core

import android.os.Build

data class SoulSelfModel(
    val version: String,
    val android: String,
    val api: Int,
    val capabilities: List<Capability>,
    val limitations: List<String>
) {
    fun summary(): String = buildString {
        append("Soul ").append(version).append(" • Android ").append(android).append("/API ").append(api)
        append(" • capabilities=").append(capabilities.count { it.availability == CapabilityAvailability.AVAILABLE })
        append('/').append(capabilities.size)
    }
}

fun buildSelfModel(capabilities: List<Capability>) = SoulSelfModel(
    version = "0.2-core",
    android = Build.VERSION.RELEASE,
    api = Build.VERSION.SDK_INT,
    capabilities = capabilities,
    limitations = listOf(
        "Privileged execution requires Guardian authorization and a working bridge.",
        "No model training is performed on-device.",
        "Unavailable Android APIs are reported rather than simulated."
    )
)
