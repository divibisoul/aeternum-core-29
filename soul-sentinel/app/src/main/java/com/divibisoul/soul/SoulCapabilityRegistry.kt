package com.divibisoul.soul

import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

/** Runtime capability registry. Catalog ownership and runtime metadata stay separate. */
data class SoulRegisteredCapability(
    val id: String,
    val owner: String,
    val input: String,
    val output: String,
    val transport: String,
    val requiresAi: Boolean = false,
    val dependencies: Set<String> = emptySet(),
)

class SoulCapabilityRegistry(private val nuclei: Set<String> = SoulMeshChannels.nuclei) {
    private val capabilities = ConcurrentHashMap<String, SoulRegisteredCapability>()

    init {
        SoulCapabilityCatalog.capabilities.forEach { catalogEntry ->
            register(
                SoulRegisteredCapability(
                    id = catalogEntry.id,
                    owner = catalogEntry.owner,
                    input = "json",
                    output = "json",
                    transport = when (catalogEntry.execution) {
                        Execution.LOCAL -> "local"
                        Execution.WEB_SESSION -> "web-session"
                        Execution.REMOTE_SERVICE -> "mesh-http"
                    },
                    requiresAi = catalogEntry.execution == Execution.WEB_SESSION,
                )
            )
        }
    }

    fun register(capability: SoulRegisteredCapability): SoulRegisteredCapability {
        require(capability.owner in nuclei) { "Unknown capability owner: ${capability.owner}" }
        require(capability.id.isNotBlank())
        capabilities[capability.id] = capability
        return capability
    }

    fun registerAll(items: Iterable<SoulRegisteredCapability>) { items.forEach(::register) }
    fun resolve(id: String): SoulRegisteredCapability? = capabilities[id]
    fun all(): List<SoulRegisteredCapability> = capabilities.values.sortedBy { it.id }

    fun toJson(): JSONObject = JSONObject().put("capabilities", all().map {
        JSONObject().apply {
            put("id", it.id)
            put("owner", it.owner)
            put("input", it.input)
            put("output", it.output)
            put("transport", it.transport)
            put("requiresAi", it.requiresAi)
            put("dependencies", it.dependencies.toList())
        }
    })
}
