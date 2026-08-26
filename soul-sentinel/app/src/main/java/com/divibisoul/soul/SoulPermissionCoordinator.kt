package com.divibisoul.soul

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/** Centralizes reusable device access. Permissions are requested on demand and remain usable after grant. */
class SoulPermissionCoordinator(private val activity: Activity) {
    companion object {
        const val REQUEST_DEVICE_ACCESS = 7001
        const val REQUEST_MEDIA_CAPTURE = REQUEST_DEVICE_ACCESS
        val devicePermissions = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.POST_NOTIFICATIONS,
        )
        val capturePermissions = arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
    }

    /** Requests all runtime device capabilities declared by Soul. Android still presents the user's consent UI. */
    fun requestDeviceAccess() {
        val missing = devicePermissions.filter {
            ContextCompat.checkSelfPermission(activity, it) != PackageManager.PERMISSION_GRANTED
        }.toTypedArray()
        if (missing.isNotEmpty()) ActivityCompat.requestPermissions(activity, missing, REQUEST_DEVICE_ACCESS)
    }

    fun requestCaptureAccess() {
        val missing = capturePermissions.filter {
            ContextCompat.checkSelfPermission(activity, it) != PackageManager.PERMISSION_GRANTED
        }.toTypedArray()
        if (missing.isNotEmpty()) ActivityCompat.requestPermissions(activity, missing, REQUEST_MEDIA_CAPTURE)
    }

    fun openAppSettings() {
        activity.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.parse("package:${activity.packageName}")
        })
    }

    fun openWifiSettings() {
        activity.startActivity(Intent(Settings.ACTION_WIFI_SETTINGS))
    }

    fun openNetworkSettings() {
        activity.startActivity(Intent(Settings.ACTION_WIRELESS_SETTINGS))
    }

    fun hasPermission(permission: String): Boolean =
        ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED

    fun hasCamera(): Boolean = hasPermission(Manifest.permission.CAMERA)
    fun hasMicrophone(): Boolean = hasPermission(Manifest.permission.RECORD_AUDIO)
    fun hasBluetoothConnect(): Boolean = hasPermission(Manifest.permission.BLUETOOTH_CONNECT)
    fun hasBluetoothScan(): Boolean = hasPermission(Manifest.permission.BLUETOOTH_SCAN)
    fun hasNotifications(): Boolean = hasPermission(Manifest.permission.POST_NOTIFICATIONS)
}
