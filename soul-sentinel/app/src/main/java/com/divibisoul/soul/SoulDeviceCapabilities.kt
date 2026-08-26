package com.divibisoul.soul

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.Settings

/** Real Android-facing device capability adapter for the hybrid Soul shell. */
class SoulDeviceCapabilities(private val activity: Activity) {
    companion object {
        const val REQUEST_FILES = 8101
        const val REQUEST_MEDIA = 8102
    }

    fun openFilePicker(allowMultiple: Boolean = true) {
        activity.startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, allowMultiple)
        }, REQUEST_FILES)
    }

    fun openMediaPicker() {
        activity.startActivityForResult(Intent(Intent.ACTION_PICK).apply {
            type = "image/*"
        }, REQUEST_MEDIA)
    }

    fun openAppSettings() {
        activity.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.parse("package:${activity.packageName}")
        })
    }
}
