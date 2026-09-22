package com.divibisoul.soul.data

import android.content.Context
import androidx.room.Room
import java.util.UUID

class FeedbackRepository(context: Context) {
    private val db = Room.databaseBuilder(
        context.applicationContext,
        SoulLocalDatabase::class.java,
        "soul_local.db"
    ).build()

    suspend fun append(type: String, payload: String) {
        db.logDao().insert(
            LogEntity(
                id = UUID.randomUUID().toString(),
                timestamp = System.currentTimeMillis(),
                type = type,
                payload = payload
            )
        )
    }

    suspend fun purge(retentionDays: Int) {
        val cutoff = System.currentTimeMillis() - retentionDays.coerceAtLeast(1) * 86_400_000L
        db.logDao().deleteBefore(cutoff)
    }

    suspend fun pending(limit: Int = 100) = db.logDao().pending(limit)
    suspend fun markSynced(ids: List<String>) {
        if (ids.isNotEmpty()) db.logDao().markSynced(ids)
    }
}
