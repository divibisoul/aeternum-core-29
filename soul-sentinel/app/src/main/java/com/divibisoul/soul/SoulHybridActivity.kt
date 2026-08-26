package com.divibisoul.soul

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.widget.Button
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.core.app.ActivityCompat
import org.json.JSONArray
import org.json.JSONObject

/** Hybrid AGI shell. Interface, Pilot and Cockpit remain distinct layers. */
class SoulHybridActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private lateinit var permissionCoordinator: SoulPermissionCoordinator
    private lateinit var deviceCapabilities: SoulDeviceCapabilities
    private lateinit var status: TextView
    private lateinit var mesh: SoulMeshRuntime
    private lateinit var registry: SoulCapabilityRegistry
    private lateinit var pilot: SoulPilot
    private var pendingMediaRequest: android.webkit.PermissionRequest? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        permissionCoordinator = SoulPermissionCoordinator(this)
        deviceCapabilities = SoulDeviceCapabilities(this)
        val config = SoulConfig(this)
        mesh = SoulMeshBootstrap.create(webDelegate = SoulMeshBootstrap::delegateToWeb, remoteEndpoints = config.meshEndpoints())
        registry = SoulCapabilityRegistry()
        pilot = SoulPilot(registry, mesh)

        setContentView(R.layout.activity_soul_shell)
        status = findViewById(R.id.soul_status)
        webView = findViewById(R.id.soul_browser)
        SoulSecureWebView.configure(webView)
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: android.webkit.PermissionRequest) {
                runOnUiThread {
                    val allowed = request.resources.filter {
                        it == android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE || it == android.webkit.PermissionRequest.RESOURCE_AUDIO_CAPTURE
                    }.toTypedArray()
                    if (allowed.isEmpty()) { request.deny(); return@runOnUiThread }
                    val missing = mutableListOf<String>()
                    if (allowed.contains(android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE) && !permissionCoordinator.hasCamera()) missing += android.Manifest.permission.CAMERA
                    if (allowed.contains(android.webkit.PermissionRequest.RESOURCE_AUDIO_CAPTURE) && !permissionCoordinator.hasMicrophone()) missing += android.Manifest.permission.RECORD_AUDIO
                    if (missing.isEmpty()) grantWebMediaRequest(request)
                    else {
                        pendingMediaRequest = request
                        ActivityCompat.requestPermissions(this@SoulHybridActivity, missing.toTypedArray(), SoulPermissionCoordinator.REQUEST_MEDIA_CAPTURE)
                    }
                }
            }
        }

        val mesh60 = SoulMesh60ChannelAccess(config.meshEndpoints())
        SoulHybridBridge.attach(webView, SoulHybridBridge("N01", { message -> mesh.send(message.source, message.target, message.capability, message.payload) }, { completion ->
            webView.post { webView.evaluateJavascript("window.SoulHybridRuntime&&window.SoulHybridRuntime.receive&&window.SoulHybridRuntime.receive(${JSONObject.quote(completion.toJson().toString())});", null) }
        }, pilot = pilot, probe60 = { mesh60.probeAll() }))
        webView.loadUrl(SoulSecureWebView.localUrl())

        bindAi(R.id.button_ai_1, SoulAiProvider.CHATGPT)
        bindAi(R.id.button_ai_2, SoulAiProvider.CLAUDE)
        findViewById<Button>(R.id.button_chat).setOnClickListener { focusBrowser("chat") }
        findViewById<Button>(R.id.button_pilot).setOnClickListener { focusBrowser("pilot") }
        findViewById<Button>(R.id.button_cockpit).setOnClickListener { focusBrowser("cockpit") }
        findViewById<Button>(R.id.button_capabilities).setOnClickListener { focusBrowser("capabilities") }
        findViewById<Button>(R.id.button_device).setOnClickListener { showDeviceAccess() }
        findViewById<Button>(R.id.button_files).setOnClickListener { deviceCapabilities.openFilePicker(true) }
        findViewById<Button>(R.id.button_media).setOnClickListener { deviceCapabilities.openMediaPicker() }
        findViewById<Button>(R.id.button_camera).setOnClickListener { status.text = "Camera capability requested"; if (permissionCoordinator.hasCamera()) focusBrowser("camera") else permissionCoordinator.requestCaptureAccess() }
        findViewById<Button>(R.id.button_mic).setOnClickListener { status.text = "Microphone capability requested"; if (permissionCoordinator.hasMicrophone()) focusBrowser("microphone") else permissionCoordinator.requestCaptureAccess() }
        status.text = "Hybrid AGI ready • browser + Pilot + Cockpit + capabilities"
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (resultCode != RESULT_OK || data == null) return
        val uris = mutableListOf<Uri>()
        data.data?.let { uris += it }
        data.clipData?.let { clip -> for (i in 0 until clip.itemCount) uris += clip.getItemAt(i).uri }
        val uniqueUris = uris.distinct()
        uniqueUris.forEach { deviceCapabilities.persistReadAccess(it) }
        if (requestCode == SoulDeviceCapabilities.REQUEST_FILES || requestCode == SoulDeviceCapabilities.REQUEST_MEDIA) {
            status.text = "${uniqueUris.size} resource(s) available to Soul"
            deliverDeviceResources(requestCode, uniqueUris)
        }
    }

    private fun deliverDeviceResources(requestCode: Int, uris: List<Uri>) {
        val resources = JSONArray().apply { uris.forEach { put(JSONObject().put("uri", it.toString()).put("capability", if (requestCode == SoulDeviceCapabilities.REQUEST_MEDIA) "media.pick" else "files.pick")) } }
        val event = JSONObject().put("type", "device.resource.selected").put("resources", resources).put("source", "N01")
        webView.post { webView.evaluateJavascript("window.SoulHybridRuntime&&window.SoulHybridRuntime.receiveDeviceResource&&window.SoulHybridRuntime.receiveDeviceResource(${JSONObject.quote(event.toString())});", null) }
    }

    private fun grantWebMediaRequest(request: android.webkit.PermissionRequest) {
        val allowed = request.resources.filter { (it == android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE && permissionCoordinator.hasCamera()) || (it == android.webkit.PermissionRequest.RESOURCE_AUDIO_CAPTURE && permissionCoordinator.hasMicrophone()) }.toTypedArray()
        if (allowed.isNotEmpty()) request.grant(allowed) else request.deny()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != SoulPermissionCoordinator.REQUEST_MEDIA_CAPTURE && requestCode != SoulPermissionCoordinator.REQUEST_DEVICE_ACCESS) return
        pendingMediaRequest?.let { request -> pendingMediaRequest = null; grantWebMediaRequest(request) }
    }

    private fun bindAi(buttonId: Int, provider: SoulAiProvider) { findViewById<Button>(buttonId).setOnClickListener { startActivity(Intent(this, SoulAiSessionActivity::class.java).apply { putExtra("provider", provider.name) }) } }
    private fun focusBrowser(area: String) { status.text = "Soul area: ${area.replaceFirstChar { it.uppercase() }}"; webView.visibility = View.VISIBLE; webView.evaluateJavascript("window.SoulHybridRuntime&&window.SoulHybridRuntime.openArea&&window.SoulHybridRuntime.openArea(${JSONObject.quote(area)});", null) }
    private fun showDeviceAccess() { permissionCoordinator.requestDeviceAccess(); status.text = "Device capabilities requested — user controls each permission" }
}
