package com.divibisoul.soul.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "event_log")
data class LogEntity(
    @PrimaryKey val id: String,
    val timestamp: Long,
    val type: String,
    val payload: String,
    val synced: Boolean = false
)
