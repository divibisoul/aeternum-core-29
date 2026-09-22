package com.divibisoul.soul.core.security

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyPairGenerator
import java.security.PrivateKey
import java.security.Signature
import java.util.Base64

enum class LocalRole { ADMIN, OPERATOR, OBSERVER }

class AuthAndSignature(private val context: Context) {
    private val alias = "soul-admin-event-signing-v1"

    fun ensureKey(): PrivateKey {
        val ks = java.security.KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        if (!ks.containsAlias(alias)) {
            KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore").apply {
                initialize(
                    KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY)
                        .setAlgorithmParameterSpec(java.security.spec.ECGenParameterSpec("secp256r1"))
                        .setDigests(KeyProperties.DIGEST_SHA256)
                        .build()
                )
                generateKeyPair()
            }
        }
        return ks.getKey(alias, null) as PrivateKey
    }

    fun signCriticalEvent(payload: ByteArray): String {
        val signature = Signature.getInstance("SHA256withECDSA").apply {
            initSign(ensureKey())
            update(payload)
        }.sign()
        return Base64.getEncoder().encodeToString(signature)
    }

    fun can(role: LocalRole, action: String): Boolean = canRole(role, action)

    companion object {
        fun canRole(role: LocalRole, action: String): Boolean = when (role) {
        LocalRole.ADMIN -> true
        LocalRole.OPERATOR -> action !in setOf("root", "destructive", "credential")
        LocalRole.OBSERVER -> action in setOf("observe", "health", "read")
        }
    }
}
