package com.divibisoul.soul

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat

/** Central permission/capability mapping; denial never crashes the Soul runtime. */
object SoulDevicePermissionMatrix {
    const val CAMERA = "device.camera"
    const val MICROPHONE = "device.microphone"
    const val LOCATION = "device.location"
    const val BLUETOOTH = "device.bluetooth"
    const val NOTIFICATIONS = "device.notifications"

    private val permissions = mapOf(
        CAMERA to arrayOf(Manifest.permission.CAMERA),
        MICROPHONE to arrayOf(Manifest.permission.RECORD_AUDIO),
        LOCATION to arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION),
        BLUETOOTH to arrayOf(Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_SCAN),
        NOTIFICATIONS to arrayOf(Manifest.permission.POST_NOTIFICATIONS),
    )

    fun requiredPermissions(capability: String): Array<String> = permissions[capability].orEmpty()

    fun granted(context: Context, capability: String): Boolean = requiredPermissions(capability).all {
        ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
    }

    fun missing(context: Context, capability: String): Array<String> = requiredPermissions(capability).filter {
        ContextCompat.checkSelfPermission(context, it) != PackageManager.PERMISSION_GRANTED
    }.toTypedArray()
}
