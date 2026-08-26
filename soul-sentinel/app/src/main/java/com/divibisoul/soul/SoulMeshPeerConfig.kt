package com.divibisoul.soul

/** Runtime-configurable peer endpoints. Empty values mean that a peer is not deployed/reachable yet. */
object SoulMeshPeerConfig {
    const val N02 = BuildConfig.SOUL_MESH_N02_URL

    fun endpointFor(nucleus: String): String? = when (nucleus) {
        "N02" -> N02.takeIf { it.isNotBlank() }
        else -> null
    }
}
