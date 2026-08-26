package com.divibisoul.soul

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.activity.result.contract.ActivityResultContracts

/** Android device capabilities exposed to the hybrid AGI through explicit user actions. */
class SoulDeviceCapabilities(private val activity: Activity) {
    companion object {
        const val ACTION_PICK_FILE = 7101
        const val ACTION_PICK_FILES = 7102
    }

    fun openFilePicker(multiple: Boolean = true) {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple)
        }
        activity.startActivityForResult(intent, if (multiple) ACTION_PICK_FILES else ACTION_PICK_FILE)
    }

    fun openMediaPicker() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "image/*"
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
        }
        activity.startActivityForResult(intent, ACTION_PICK_FILES)
    }
}
