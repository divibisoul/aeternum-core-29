package com.divibisoul.soul.core.security;

interface IPrivilegedShell {
    void destroy() = 16777114;
    String exec(String command) = 2;
}
