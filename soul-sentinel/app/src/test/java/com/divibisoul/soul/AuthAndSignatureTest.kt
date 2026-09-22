package com.divibisoul.soul

import com.divibisoul.soul.core.security.AuthAndSignature
import com.divibisoul.soul.core.security.LocalRole
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AuthAndSignatureTest {
    @Test fun rbacIsExplicit() {
        assertTrue(AuthAndSignature.canRole(LocalRole.OBSERVER, "read"))
        assertFalse(AuthAndSignature.canRole(LocalRole.OBSERVER, "root"))
        assertTrue(AuthAndSignature.canRole(LocalRole.OPERATOR, "health"))
        assertFalse(AuthAndSignature.canRole(LocalRole.OPERATOR, "destructive"))
        assertTrue(AuthAndSignature.canRole(LocalRole.ADMIN, "root"))
    }
}
