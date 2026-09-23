package com.divibisoul.soul.data

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(entities = [LogEntity::class], version = 1, exportSchema = false)
abstract class SoulLocalDatabase : RoomDatabase() {
    abstract fun logDao(): LogDao
}
