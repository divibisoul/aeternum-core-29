package com.divibisoul.soul

import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

/** Runtime capability catalog. It describes ownership and execution without coupling UI to nuclei. */
data class SoulCapability(
    val id: String,
    val owner: String,
    val input: String,
    val output: String,
    val transport: String,
    val requiresAi: Boolean = false,
    val dependencies: Set<String> = emptySet(),
)

class SoulCapabilityRegistry(private val nuclei: Set<String> = SoulMeshChannels.nuclei) {
    private val capabilities = ConcurrentHashMap<String, SoulCapability>()

    fun register(capability: SoulCapability): SoulCapability {
        require(capability.owner in nuclei) { "Unknown capability owner: ${capability.owner}" }
        require(capability.id.isNotBlank())
        capabilities[capability.id] = capability
        return capability
    }

    fun registerAll(items: Iterable<SoulCapability>) { items.forEach(::register) }

    fun resolve(id: String): SoulCapability? = capabilities[id]
    fun all(): List<SoulCapability> = capabilities.values.sortedBy { it.id }

    fun toJson(): JSONObject = JSONObject().put("capabilities", all().map {
        JSONObject().apply {
            put("id", it.id); put("owner", it.owner); put("input", it.input)
            put("output", it.output); put("transport", it.transport)
            put("requiresAi", it.requiresAi); put("dependencies", it.dependencies.toList())
        }
    })
}
