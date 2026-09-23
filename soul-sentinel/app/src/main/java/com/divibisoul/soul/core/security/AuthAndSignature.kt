package com.divibisoul.soul.core.security

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyPairGenerator
import java.security.PrivateKey
import java.security.Signature
import java.security.spec.ECGenParameterSpec
import java.util.Base64

enum class LocalRole { ADMIN, OPERATOR, OBSERVER }

class AuthAndSignature(private val context: Context) {
    private val ecAlias = "soul-admin-event-signing-v1"
    private val edAlias = "soul-admin-event-signing-ed25519-v1"

    private fun keyStore(): java.security.KeyStore =
        java.security.KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

    private fun ensureEd25519(ks: java.security.KeyStore): PrivateKey? = runCatching {
        if (!ks.containsAlias(edAlias)) {
            val generator = KeyPairGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_EC,
                "AndroidKeyStore",
            )
            generator.initialize(
                KeyGenParameterSpec.Builder(
                    edAlias,
                    KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY,
                )
                    .setAlgorithmParameterSpec(ECGenParameterSpec("ed25519"))
                    .setDigests(KeyProperties.DIGEST_NONE)
                    .build(),
            )
            generator.generateKeyPair()
        }
        val key = ks.getKey(edAlias, null) as PrivateKey
        Signature.getInstance("Ed25519").initSign(key)
        key
    }.getOrNull()

    private fun ensureP256(ks: java.security.KeyStore): PrivateKey {
        if (!ks.containsAlias(ecAlias)) {
            val generator = KeyPairGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_EC,
                "AndroidKeyStore",
            )
            generator.initialize(
                KeyGenParameterSpec.Builder(
                    ecAlias,
                    KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY,
                )
                    .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
                    .setDigests(KeyProperties.DIGEST_SHA256)
                    .build(),
            )
            generator.generateKeyPair()
        }
        return ks.getKey(ecAlias, null) as PrivateKey
    }

    /**
     * Prefer Ed25519 when AndroidKeyStore + the platform signature provider
     * support it; fall back to hardware-backed P-256 ECDSA otherwise.
     */
    fun ensureKey(): PrivateKey {
        val ks = keyStore()
        return ensureEd25519(ks) ?: ensureP256(ks)
    }

    private fun signingMaterial(): Pair<PrivateKey, String> {
        val ks = keyStore()
        val ed = ensureEd25519(ks)
        return if (ed != null) ed to "Ed25519" else ensureP256(ks) to "SHA256withECDSA"
    }

    fun signCriticalEvent(payload: ByteArray): String {
        val (key, algorithm) = signingMaterial()
        val signature = Signature.getInstance(algorithm).apply {
            initSign(key)
            update(payload)
        }.sign()
        return Base64.getEncoder().encodeToString(signature)
    }

    fun can(role: LocalRole, action: String): Boolean = canRole(role, action)

    companion object {
        fun canRole(role: LocalRole, action: String): Boolean = when (role) {
            LocalRole.ADMIN -> true
            LocalRole.OPERATOR -> action in setOf("diagnostic", "observe", "health", "read")
            LocalRole.OBSERVER -> action in setOf("observe", "health", "read")
        }
    }
}
