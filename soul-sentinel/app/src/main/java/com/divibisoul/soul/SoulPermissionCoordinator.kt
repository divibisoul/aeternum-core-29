package com.divibisoul.soul

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/** Centralizes runtime permissions and system-settings navigation without pretending that a permission is granted. */
class SoulPermissionCoordinator(private val activity: Activity) {
    companion object {
        const val REQUEST_MEDIA_CAPTURE = 7001
        val capturePermissions = arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
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

    fun hasCamera(): Boolean = ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
    fun hasMicrophone(): Boolean = ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
}
