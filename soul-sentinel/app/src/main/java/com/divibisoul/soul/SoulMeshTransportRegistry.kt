package com.divibisoul.soul

/**
 * Per-nucleus transport routing for the hybrid Soul mesh.
 *
 * A nucleus is not required to communicate through a URL. The transport is selected
 * per peer and can be in-process, Android/local IPC, loopback, or network based.
 * The mesh contract remains identical regardless of the physical transport.
 */
class SoulMeshTransportRegistry {
    private val routes = LinkedHashMap<String, SoulMeshTransporter>()

    fun bind(nucleusId: String, transporter: SoulMeshTransporter) {
        require(nucleusId in SoulMeshChannels.nuclei) { "Unknown nucleus: $nucleusId" }
        routes[nucleusId] = transporter
    }

    fun unbind(nucleusId: String) {
        routes.remove(nucleusId)
    }

    fun transporterFor(nucleusId: String): SoulMeshTransporter? = routes[nucleusId]

    fun hasRoute(nucleusId: String): Boolean = routes.containsKey(nucleusId)

    fun routedNuclei(): Set<String> = routes.keys.toSet()

    fun allPeersRouted(localNucleus: String): Boolean =
        SoulMeshChannels.out(localNucleus).all { routes.containsKey(it) }
}
