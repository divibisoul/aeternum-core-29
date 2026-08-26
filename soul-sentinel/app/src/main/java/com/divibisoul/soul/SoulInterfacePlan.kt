package com.divibisoul.soul

/** Product-level map for the first production APK. It keeps UI concerns separate from the Mesh. */
object SoulInterfacePlan {
    val primaryAreas = listOf(
        "Pilot" to "Orchestrate AI sessions, capabilities and work across the hybrid fabric",
        "Cockpit" to "Observe and control Mesh, runtimes, resources and execution",
        "Browser" to "Host user AI web sessions without requiring provider API keys",
        "Chat" to "Single user conversation surface routed through Pilot",
        "AI Sessions" to "Three recommended provider slots; extensible beyond three",
        "Device" to "Permission-aware access to camera, microphone, Wi-Fi and Android settings",
        "Capabilities" to "Expose available tools with owner, dependency, transport and execution state",
        "Mesh" to "Expose direct nucleus-to-nucleus health and E2E evidence"
    )

    val recommendedAiSlots = listOf(
        "IA 1" to "primary executor",
        "IA 2" to "independent analyst / multimodal specialist",
        "IA 3" to "critic / validator / synthesis specialist"
    )
}
