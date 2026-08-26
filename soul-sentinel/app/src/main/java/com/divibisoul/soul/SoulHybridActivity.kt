package com.divibisoul.soul

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.widget.Button
import android.widget.TextView
import androidx.activity.ComponentActivity

/** First production-oriented Soul shell: AGI browser + AI sessions + Pilot/Cockpit + capabilities + device access. */
class SoulHybridActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private lateinit var permissionCoordinator: SoulPermissionCoordinator
    private lateinit var status: TextView
    private lateinit var mesh: SoulMeshRuntime

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        permissionCoordinator = SoulPermissionCoordinator(this)
        val config = SoulConfig(this)
        mesh = SoulMeshBootstrap.create(
            webDelegate = SoulMeshBootstrap::delegateToWeb,
            remoteEndpoints = config.meshEndpoints(),
        )

        setContentView(R.layout.activity_soul_shell)
        status = findViewById(R.id.soul_status)
        webView = findViewById(R.id.soul_browser)
        SoulSecureWebView.configure(webView)
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: android.webkit.PermissionRequest) {
                runOnUiThread {
                    permissionCoordinator.requestCaptureAccess()
                    val allowed = request.resources.filter {
                        it == android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE ||
                            it == android.webkit.PermissionRequest.RESOURCE_AUDIO_CAPTURE
                    }.toTypedArray()
                    if (allowed.isNotEmpty() && permissionCoordinator.hasCamera() && permissionCoordinator.hasMicrophone()) {
                        request.grant(allowed)
                    }
                }
            }
        }

        val mesh60 = SoulMesh60ChannelAccess(config.meshEndpoints())
        SoulHybridBridge.attach(webView, SoulHybridBridge("N01", { message ->
            mesh.send(message.source, message.target, message.capability ?: "", message.payload)
        }, { completion ->
            webView.post {
                val json = org.json.JSONObject.quote(completion.toJson().toString())
                webView.evaluateJavascript("window.SoulHybridRuntime&&window.SoulHybridRuntime.receive&&window.SoulHybridRuntime.receive($json);", null)
            }
        }, probe60 = { mesh60.probeAll() }))
        webView.loadUrl(SoulSecureWebView.localUrl())

        bindAi(R.id.button_ai_1, SoulAiProvider.CHATGPT)
        bindAi(R.id.button_ai_2, SoulAiProvider.GEMINI)
        bindAi(R.id.button_ai_3, SoulAiProvider.CLAUDE)
        findViewById<Button>(R.id.button_chat).setOnClickListener { focusBrowser("chat") }
        findViewById<Button>(R.id.button_pilot).setOnClickListener { focusBrowser("pilot") }
        findViewById<Button>(R.id.button_cockpit).setOnClickListener { focusBrowser("cockpit") }
        findViewById<Button>(R.id.button_capabilities).setOnClickListener { focusBrowser("capabilities") }
        findViewById<Button>(R.id.button_device).setOnClickListener { showDeviceAccess() }
        status.text = "Hybrid AGI ready • browser + Pilot + Cockpit + capabilities"
    }

    private fun bindAi(buttonId: Int, provider: SoulAiProvider) {
        findViewById<Button>(buttonId).setOnClickListener {
            startActivity(Intent(this, SoulAiSessionActivity::class.java).apply {
                putExtra("provider", provider.name)
            })
        }
    }

    private fun focusBrowser(area: String) {
        status.text = "Soul area: ${area.replaceFirstChar { it.uppercase() }}"
        webView.visibility = View.VISIBLE
        webView.evaluateJavascript("window.SoulHybridRuntime&&window.SoulHybridRuntime.openArea&&window.SoulHybridRuntime.openArea(${org.json.JSONObject.quote(area)});", null)
    }

    private fun showDeviceAccess() {
        permissionCoordinator.requestCaptureAccess()
        permissionCoordinator.openWifiSettings()
    }
}
