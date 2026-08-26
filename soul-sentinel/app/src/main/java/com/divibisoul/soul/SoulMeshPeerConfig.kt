package com.divibisoul.soul

/** Build-time peer registry. Empty values mean the peer is not deployed/reachable yet. */
object SoulMeshPeerConfig {
    const val N02 = BuildConfig.SOUL_MESH_N02_URL
    const val N03 = BuildConfig.SOUL_MESH_N03_URL
    const val N04 = BuildConfig.SOUL_MESH_N04_URL
    const val N05 = BuildConfig.SOUL_MESH_N05_URL
    const val N06 = BuildConfig.SOUL_MESH_N06_URL

    fun endpointFor(nucleus: String): String? = when (nucleus) {
        "N02" -> N02.takeIf { it.isNotBlank() }
        "N03" -> N03.takeIf { it.isNotBlank() }
        "N04" -> N04.takeIf { it.isNotBlank() }
        "N05" -> N05.takeIf { it.isNotBlank() }
        "N06" -> N06.takeIf { it.isNotBlank() }
        else -> null
    }
}
