package com.divibisoul.soul

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.webkit.WebView
import androidx.activity.ComponentActivity
import org.json.JSONObject

/**
 * User-facing hybrid APK host.
 *
 * The native shell owns the AI-session dock and Mesh/Pilot boundary; the WebView
 * remains the user-facing browser/runtime surface. AI provider sessions are
 * opened in isolated provider WebViews rather than through provider APIs.
 */
class SoulHybridActivity : ComponentActivity() {
    private lateinit var mesh: SoulMeshRuntime
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val config = SoulConfig(this)
        mesh = SoulMeshBootstrap.create(
            webDelegate = SoulMeshBootstrap::delegateToWeb,
            remoteEndpoints = config.meshEndpoints(),
        )
        val mesh60 = SoulMesh60ChannelAccess(config.meshEndpoints())

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.BLACK)
        }

        val title = TextView(this).apply {
            text = "SOUL  •  HYBRID AI COCKPIT"
            setTextColor(Color.WHITE)
            textSize = 16f
            gravity = Gravity.CENTER_VERTICAL
            setPadding(20, 16, 20, 8)
        }
        root.addView(title, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        val subtitle = TextView(this).apply {
            text = "3 AI sessions recommended • login in the provider browser • no API key required by Soul"
            setTextColor(Color.LTGRAY)
            textSize = 12f
            setPadding(20, 0, 20, 12)
        }
        root.addView(subtitle, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        val aiDock = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(12, 4, 12, 12)
        }
        SoulAiProvider.entries.forEach { provider ->
            val button = Button(this).apply {
                text = provider.displayName
                setOnClickListener {
                    startActivity(Intent(this@SoulHybridActivity, SoulAiSessionActivity::class.java).apply {
                        putExtra("provider", provider.name)
                    })
                }
            }
            aiDock.addView(button, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                marginStart = 4
                marginEnd = 4
            })
        }
        root.addView(aiDock, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        val cockpit = TextView(this).apply {
            text = "PILOT / MESH  •  60 channels available  •  direct P2P fabric"
            setTextColor(Color.WHITE)
            textSize = 12f
            setPadding(20, 4, 20, 8)
        }
        root.addView(cockpit, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        webView = WebView(this)
        SoulSecureWebView.configure(webView)
        SoulHybridBridge.attach(webView, SoulHybridBridge("N01", { message ->
            mesh.send(message.source, message.target, message.capability ?: "", message.payload)
        }, { completion ->
            webView.post {
                val json = JSONObject.quote(completion.toJson().toString())
                webView.evaluateJavascript("window.SoulHybridRuntime&&window.SoulHybridRuntime.receive(JSON.parse($json));", null)
            }
        }, probe60 = { mesh60.probeAll() }))
        webView.loadUrl(SoulSecureWebView.localUrl())
        root.addView(webView, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))

        setContentView(root)
    }
}
