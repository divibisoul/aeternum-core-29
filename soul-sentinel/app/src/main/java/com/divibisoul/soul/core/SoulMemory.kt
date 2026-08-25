package com.divibisoul.soul.core

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.concurrent.CopyOnWriteArrayList

/** Local episodic memory foundation. Keeps bounded, structured events on-device. */
data class MemoryEpisode(
    val timestamp: Long,
    val type: String,
    val summary: String,
    val confidence: Float = 1f
)

class SoulMemory(context: Context, private val maxEpisodes: Int = 500) {
    private val file = File(context.filesDir, "soul_episodic_memory.json")
    private val episodes = CopyOnWriteArrayList<MemoryEpisode>()

    init { load() }

    @Synchronized fun remember(type: String, summary: String, confidence: Float = 1f) {
        episodes.add(MemoryEpisode(System.currentTimeMillis(), type, summary, confidence.coerceIn(0f, 1f)))
        while (episodes.size > maxEpisodes) episodes.removeAt(0)
        persist()
    }

    fun recent(limit: Int = 50): List<MemoryEpisode> = episodes.takeLast(limit.coerceAtMost(episodes.size))

    @Synchronized private fun persist() {
        val array = JSONArray()
        episodes.forEach { e ->
            array.put(JSONObject().apply {
                put("timestamp", e.timestamp); put("type", e.type)
                put("summary", e.summary); put("confidence", e.confidence.toDouble())
            })
        }
        file.writeText(array.toString())
    }

    private fun load() {
        if (!file.exists()) return
        runCatching {
            val array = JSONArray(file.readText())
            for (i in 0 until array.length()) {
                val o = array.getJSONObject(i)
                episodes.add(MemoryEpisode(o.getLong("timestamp"), o.getString("type"), o.getString("summary"), o.optDouble("confidence", 1.0).toFloat()))
            }
        }
    }
}
