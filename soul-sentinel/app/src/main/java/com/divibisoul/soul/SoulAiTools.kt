package com.divibisoul.soul

/**
 * Provider-neutral AI tool contract for the Soul.
 *
 * Nucleus 05 currently provides the source implementation through its
 * requestSuggestions tool. The Android nucleus exposes the capability without
 * embedding the web chatbot or a provider/API key into the native layer.
 */
object SoulAiTools {
    const val REQUEST_SUGGESTIONS = "ai.request_suggestions"

    data class SuggestionRequest(
        val documentId: String,
        val content: String? = null
    )

    data class ToolRequest(
        val capability: String,
        val payload: SuggestionRequest
    )

    fun requestSuggestions(documentId: String, content: String? = null): ToolRequest =
        ToolRequest(
            capability = REQUEST_SUGGESTIONS,
            payload = SuggestionRequest(documentId = documentId, content = content)
        )
}
