package com.divibisoul.soul

import com.divibisoul.soul.core.security.AuthAndSignature
import com.divibisoul.soul.core.security.LocalRole
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AuthAndSignatureTest {
    @Test fun rbacIsExplicit() {
        assertTrue(AuthAndSignature::class.java != null)
        assertTrue(com.divibisoul.soul.core.security.AuthAndSignature(
            org.mockito.Mockito.mock(android.content.Context::class.java)
        ).can(LocalRole.OBSERVER, "read"))
        assertFalse(com.divibisoul.soul.core.security.AuthAndSignature(
            org.mockito.Mockito.mock(android.content.Context::class.java)
        ).can(LocalRole.OBSERVER, "root"))
    }
}
