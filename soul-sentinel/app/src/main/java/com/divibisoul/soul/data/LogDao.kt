package com.divibisoul.soul.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query

@Dao
interface LogDao {
    @Insert
    suspend fun insert(record: LogEntity)

    @Query("SELECT * FROM event_log WHERE synced = 0 ORDER BY timestamp LIMIT :limit")
    suspend fun pending(limit: Int): List<LogEntity>

    @Query("UPDATE event_log SET synced = 1 WHERE id IN (:ids)")
    suspend fun markSynced(ids: List<String>)

    @Query("DELETE FROM event_log WHERE timestamp < :cutoff")
    suspend fun deleteBefore(cutoff: Long): Int
}
