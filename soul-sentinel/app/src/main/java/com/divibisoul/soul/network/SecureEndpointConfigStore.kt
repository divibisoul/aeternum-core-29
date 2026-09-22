package com.divibisoul.soul.network

import android.content.Context
import android.util.Base64
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec

private val Context.endpointDataStore by preferencesDataStore("soul_endpoints")

data class EndpointConfig(
    val saraBaseUrl: String? = null,
    val n07BaseUrl: String? = null,
    val n07Enabled: Boolean = false,
    val feedbackSyncUrl: String? = null,
    val requestTimeoutMs: Long = 10_000L,
    val saraTokenConfigured: Boolean = false,
    val n07TokenConfigured: Boolean = false
)

class SecureEndpointConfigStore(private val context: Context) {
    private val alias = "soul-admin-config-v1"

    suspend fun setSara(baseUrl: String, token: String?) {
        context.endpointDataStore.edit {
            it[SARA_URL] = baseUrl.trimEnd('/')
            if (!token.isNullOrBlank()) it[SARA_TOKEN] = encrypt(token)
        }
    }

    suspend fun setN07(baseUrl: String?, token: String?) {
        context.endpointDataStore.edit {
            if (baseUrl.isNullOrBlank()) it.remove(N07_URL) else it[N07_URL] = baseUrl.trimEnd('/')
            if (!token.isNullOrBlank()) it[N07_TOKEN] = encrypt(token)
            it[N07_ENABLED] = !baseUrl.isNullOrBlank()
        }
    }

    suspend fun setFeedbackSyncUrl(url: String?) {
        context.endpointDataStore.edit {
            if (url.isNullOrBlank()) it.remove(FEEDBACK_SYNC_URL)
            else it[FEEDBACK_SYNC_URL] = url.trimEnd('/')
        }
    }

    suspend fun read(): EndpointConfig {
        val p = context.endpointDataStore.data.first()
        return EndpointConfig(
            saraBaseUrl = p[SARA_URL],
            n07BaseUrl = p[N07_URL],
            n07Enabled = p[N07_ENABLED] == true,
            feedbackSyncUrl = p[FEEDBACK_SYNC_URL],
            requestTimeoutMs = p[TIMEOUT]?.toLongOrNull() ?: 10_000L,
            saraTokenConfigured = p[SARA_TOKEN] != null,
            n07TokenConfigured = p[N07_TOKEN] != null
        )
    }

    suspend fun saraToken(): String? = context.endpointDataStore.data.first()[SARA_TOKEN]?.let(::decrypt)
    suspend fun n07Token(): String? = context.endpointDataStore.data.first()[N07_TOKEN]?.let(::decrypt)
    suspend fun feedbackSyncUrl(): String? = context.endpointDataStore.data.first()[FEEDBACK_SYNC_URL]

    suspend fun setTimeout(ms: Long) {
        context.endpointDataStore.edit { it[TIMEOUT] = ms.coerceIn(1000L, 120_000L).toString() }
    }

    private fun key() = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }.let { ks ->
        if (!ks.containsAlias(alias)) {
            KeyGenerator.getInstance("AES", "AndroidKeyStore").apply {
                init(
                    android.security.keystore.KeyGenParameterSpec.Builder(
                        alias,
                        android.security.keystore.KeyProperties.PURPOSE_ENCRYPT or
                            android.security.keystore.KeyProperties.PURPOSE_DECRYPT
                    )
                        .setBlockModes(android.security.keystore.KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(android.security.keystore.KeyProperties.ENCRYPTION_PADDING_NONE)
                        .build()
                )
                generateKey()
            }
        }
        ks.getKey(alias, null)
    }

    private fun encrypt(value: String): String {
        val secret = key()
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, secret)
        val iv = cipher.iv
        val data = cipher.doFinal(value.toByteArray(Charsets.UTF_8))
        return Base64.encodeToString(iv + data, Base64.NO_WRAP)
    }

    private fun decrypt(value: String): String {
        val bytes = Base64.decode(value, Base64.NO_WRAP)
        val iv = bytes.copyOfRange(0, 12)
        val data = bytes.copyOfRange(12, bytes.size)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, iv))
        return cipher.doFinal(data).toString(Charsets.UTF_8)
    }

    companion object {
        private val SARA_URL = stringPreferencesKey("sara_url")
        private val SARA_TOKEN = stringPreferencesKey("sara_token_enc")
        private val N07_URL = stringPreferencesKey("n07_url")
        private val N07_TOKEN = stringPreferencesKey("n07_token_enc")
        private val N07_ENABLED = booleanPreferencesKey("n07_enabled")
        private val FEEDBACK_SYNC_URL = stringPreferencesKey("feedback_sync_url")
        private val TIMEOUT = stringPreferencesKey("timeout_ms")
    }
}
