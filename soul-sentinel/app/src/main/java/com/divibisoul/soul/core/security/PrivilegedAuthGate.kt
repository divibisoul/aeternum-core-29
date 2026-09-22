package com.divibisoul.soul.core.security

import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class PrivilegedAuthGate(private val auth: AuthAndSignature) {
    suspend fun authenticate(activity: FragmentActivity, role: LocalRole, action: String): Boolean {
        if (!auth.can(role, action)) return false

        val authenticators =
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.DEVICE_CREDENTIAL

        val prompt = BiometricPrompt(
            activity,
            activity.mainExecutor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    continuation?.resume(true)
                    continuation = null
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    continuation?.resume(false)
                    continuation = null
                }

                override fun onAuthenticationFailed() = Unit
            }
        )

        val info = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Soul Admin")
            .setSubtitle("Autorização para ação privilegiada")
            .setDescription(action)
            .setAllowedAuthenticators(authenticators)
            .build()

        return suspendCancellableCoroutine { cont ->
            continuation = cont
            cont.invokeOnCancellation {
                continuation = null
                prompt.cancelAuthentication()
            }
            prompt.authenticate(info)
        }
    }

    @Volatile
    private var continuation: kotlin.coroutines.Continuation<Boolean>? = null
}
