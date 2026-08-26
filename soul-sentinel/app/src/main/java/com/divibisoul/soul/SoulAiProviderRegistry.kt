package com.divibisoul.soul

/** Runtime registry for an arbitrary number of browser-session AI providers. */
data class SoulAiProviderRegistration(
    val id: String,
    val displayName: String,
    val role: String,
    val hosts: Set<String>,
    val loginUrl: String,
    val enabled: Boolean = true,
)

class SoulAiProviderRegistry {
    private val providers = linkedMapOf<String, SoulAiProviderRegistration>()

    init {
        registerDefaults()
    }

    fun register(provider: SoulAiProviderRegistration) {
        require(provider.id.isNotBlank())
        require(provider.loginUrl.startsWith("https://"))
        providers[provider.id] = provider
    }

    fun unregister(id: String): Boolean = providers.remove(id) != null

    fun get(id: String): SoulAiProviderRegistration? = providers[id]

    fun allEnabled(): List<SoulAiProviderRegistration> = providers.values.filter { it.enabled }

    fun all(): List<SoulAiProviderRegistration> = providers.values.toList()

    fun canHost(id: String, host: String): Boolean = providers[id]?.hosts?.contains(host) == true

    private fun registerDefaults() {
        SoulAiProvider.entries.forEach { provider ->
            register(
                SoulAiProviderRegistration(
                    id = provider.name.lowercase(),
                    displayName = provider.displayName,
                    role = provider.role,
                    hosts = provider.hosts,
                    loginUrl = provider.loginUrl,
                ),
            )
        }
    }
}
