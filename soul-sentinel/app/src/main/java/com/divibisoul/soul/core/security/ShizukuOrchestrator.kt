package com.divibisoul.soul.core.security

import android.content.ComponentName
import android.content.Context
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.IBinder
import rikka.shizuku.Shizuku
import java.util.concurrent.atomic.AtomicReference

data class ShizukuState(
    val running: Boolean,
    val permissionGranted: Boolean,
    val apiVersion: Int
)

class ShizukuOrchestrator(context: Context? = null) {
    companion object {
        const val PERMISSION_REQUEST_CODE = 7401
        private const val USER_SERVICE_VERSION = 1
        private const val USER_SERVICE_TAG = "soul-admin-privileged-shell-v1"
    }

    private val appContext = context?.applicationContext
    private val serviceArgs: Shizuku.UserServiceArgs? = appContext?.let {
        Shizuku.UserServiceArgs(
            ComponentName(it, PrivilegedShellUserService::class.java)
        )
            .version(USER_SERVICE_VERSION)
            .tag(USER_SERVICE_TAG)
            .daemon(false)
            .processNameSuffix("soul-priv")
    }

    private val binder = AtomicReference<IPrivilegedShell?>(null)
    private val binderReceivedListener = Shizuku.OnBinderReceivedListener {
        lastBinderState = true
        bindUserServiceIfReady()
    }
    private val binderDeadListener = Shizuku.OnBinderDeadListener {
        lastBinderState = false
        binder.set(null)
    }
    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            binder.set(service?.let(IPrivilegedShell.Stub::asInterface))
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            binder.set(null)
        }
    }

    @Volatile private var started = false
    @Volatile private var lastBinderState = false
    @Volatile private var serviceBound = false

    @Synchronized
    fun start() {
        if (started) {
            bindUserServiceIfReady()
            return
        }
        Shizuku.addBinderReceivedListener(binderReceivedListener)
        Shizuku.addBinderDeadListener(binderDeadListener)
        started = true
        lastBinderState = Shizuku.pingBinder()
        bindUserServiceIfReady()
    }

    @Synchronized
    fun stop() {
        if (!started) return
        if (serviceBound) {
            serviceArgs?.let { args ->
                runCatching { Shizuku.unbindUserService(args, serviceConnection, true) }
            }
        }
        serviceBound = false
        binder.set(null)
        Shizuku.removeBinderReceivedListener(binderReceivedListener)
        Shizuku.removeBinderDeadListener(binderDeadListener)
        started = false
        lastBinderState = false
    }

    fun state(): ShizukuState = runCatching {
        val running = Shizuku.pingBinder()
        val permission = running &&
            Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
        if (permission) bindUserServiceIfReady()
        ShizukuState(running, permission, Shizuku.getVersion())
    }.getOrElse {
        ShizukuState(false, false, -1)
    }

    fun requestPermissionIfNeeded() {
        val s = state()
        if (s.running && !s.permissionGranted) {
            Shizuku.requestPermission(PERMISSION_REQUEST_CODE)
        } else if (s.running && s.permissionGranted) {
            bindUserServiceIfReady()
        }
    }

    fun execute(command: String): String {
        val safeCommand = PrivilegedCommandValidator.validate(command)
        val s = state()
        if (!s.running) throw RootUnavailableException("SHIZUKU_UNAVAILABLE")
        if (!s.permissionGranted) throw SecurityException("SHIZUKU_PERMISSION_REQUIRED")
        if (appContext == null || serviceArgs == null) {
            throw IllegalStateException("SHIZUKU_CONTEXT_REQUIRED")
        }
        bindUserServiceIfReady()
        val remote = binder.get() ?: throw IllegalStateException("SHIZUKU_USER_SERVICE_NOT_READY")
        return remote.exec(safeCommand)
    }

    @Synchronized
    private fun bindUserServiceIfReady() {
        if (!started || serviceBound) return
        val args = serviceArgs ?: return
        if (!runCatching { Shizuku.pingBinder() }.getOrDefault(false)) return
        if (runCatching { Shizuku.checkSelfPermission() != PackageManager.PERMISSION_GRANTED }.getOrDefault(true)) return
        runCatching {
            Shizuku.bindUserService(args, serviceConnection)
            serviceBound = true
        }.onFailure {
            binder.set(null)
            serviceBound = false
        }
    }
}
