package com.divibisoul.soul

interface SoulMeshTransporter {
    fun send(message: SoulMeshMessage): SoulMeshMessage
}
