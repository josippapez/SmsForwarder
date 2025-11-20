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

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val notification = buildNotification()
    startForeground(SERVICE_NOTIFICATION_ID, notification)

    return START_STICKY
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val importance = NotificationManager.IMPORTANCE_DEFAULT
      val channel = NotificationChannel(CHANNEL_ID, "SMS Forwarder Service", importance).apply {
        description = "Keeps SMS forwarding service running in background"
        setShowBadge(true)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        enableLights(false)
        enableVibration(false)
      }
      val notificationManager = getSystemService(NotificationManager::class.java)
      notificationManager?.createNotificationChannel(channel)
    }
  }

  private fun buildNotification(): Notification {
    val packageManager = packageManager
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)

    val notificationIntent = launchIntent ?: Intent()
    val contentIntent = PendingIntent.getActivity(
      this,
      0,
      notificationIntent,
      PendingIntent.FLAG_IMMUTABLE
    )

    val iconResId = resources.getIdentifier("ic_notification", "drawable", packageName)
    val notificationIcon = if (iconResId != 0) iconResId else android.R.drawable.stat_notify_chat

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("SMS Forwarder Active")
      .setContentText("Tap to open app • Monitoring messages")
      .setSmallIcon(notificationIcon)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setContentIntent(contentIntent)
      .setOngoing(true)
      .setShowWhen(true)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setAutoCancel(false)
      .build()
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    super.onTaskRemoved(rootIntent)
    // Service will restart due to START_STICKY
  }

  override fun onDestroy() {
    super.onDestroy()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
  }
}
