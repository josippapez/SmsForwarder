package com.smsforwarder.backgroundservice

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class BackgroundService : Service() {

  companion object {
    private const val SERVICE_NOTIFICATION_ID = 499123
    private const val CHANNEL_ID = "MESSAGING"
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    createNotificationChannel()

    val notification = buildNotification()
    startForeground(SERVICE_NOTIFICATION_ID, notification)

    return START_STICKY
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val importance = NotificationManager.IMPORTANCE_DEFAULT
      val channel = NotificationChannel(CHANNEL_ID, "Messaging", importance).apply {
        description = "Used for running app in background"
      }
      val notificationManager = getSystemService(NotificationManager::class.java)
      notificationManager?.createNotificationChannel(channel)
    }
  }

  private fun buildNotification(): Notification {
    // Get the main activity class name from package
    val packageManager = packageManager
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)

    val notificationIntent = launchIntent ?: Intent()
    val contentIntent = PendingIntent.getActivity(
      this,
      0,
      notificationIntent,
      PendingIntent.FLAG_IMMUTABLE
    )

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("SMS Forwarder Running")
      .setContentText("Checking messages in background")
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentIntent(contentIntent)
      .setOngoing(true)
      .build()
  }

  override fun onDestroy() {
    super.onDestroy()
    stopForeground(true)
  }
}
