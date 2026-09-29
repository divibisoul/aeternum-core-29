package com.divibisoul.soul.data

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.divibisoul.soul.network.SecureEndpointConfigStore

class LogSyncWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val repository = FeedbackRepository(applicationContext)
        val synchronizer = LogSynchronizer(repository, SecureEndpointConfigStore(applicationContext))
        return synchronizer.sync().fold(
            onSuccess = { Result.success() },
            onFailure = {
                if (runAttemptCount < 5) Result.retry() else Result.failure()
            }
        )
    }
}
