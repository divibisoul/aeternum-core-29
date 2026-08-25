package com.divibisoul.soul

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

class SoulBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED && SoulConfig(context).prefsEnabled()) {
            ContextCompat.startForegroundService(context, Intent(context, SoulAdminService::class.java))
        }
    }
}

private fun SoulConfig.prefsEnabled(): Boolean = false
