package com.divibisoul.soul

import com.divibisoul.soul.core.security.PrivilegedCommandValidator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class PrivilegedCommandValidatorTest {
    @Test fun acceptsWhitelistedReadCommand() {
        assertEquals("dumpsys battery", PrivilegedCommandValidator.validate("dumpsys battery"))
    }

    @Test fun rejectsShellChaining() {
        assertThrows(SecurityException::class.java) {
            PrivilegedCommandValidator.validate("id; settings put global x 1")
        }
    }

    @Test fun rejectsUnknownBinary() {
        assertThrows(SecurityException::class.java) {
            PrivilegedCommandValidator.validate("rm -rf /")
        }
    }
}
