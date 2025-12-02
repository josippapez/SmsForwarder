package com.smsforwarder.smslistener

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object SmsNotificationHelper {
  private const val CHANNEL_ID = "smsforwarder_incoming"
  private const val CHANNEL_NAME = "Incoming messages"
  private const val CHANNEL_DESCRIPTION = "Notifications for new SMS or MMS messages"

  fun showIncomingNotification(
    context: Context,
    address: String?,
    body: String?
  ) {
    val notificationManager = NotificationManagerCompat.from(context)
    ensureChannel(notificationManager)

    val title = address?.takeIf { it.isNotBlank() } ?: "New message"
    val preview = body?.takeIf { it.isNotBlank() }
      ?: "Open SmsForwarder to view this message"

    val launchIntent = buildLaunchIntent(context, address)
    val requestCode = (address?.hashCode() ?: System.currentTimeMillis().toInt()) and 0x7FFFFFFF
    val pendingIntent = PendingIntent.getActivity(
      context,
      requestCode,
      launchIntent,
      pendingIntentFlags()
    )

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(resolveNotificationIcon(context))
      .setContentTitle(title)
      .setContentText(preview)
      .setStyle(NotificationCompat.BigTextStyle().bigText(preview))
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setAutoCancel(true)
      .setContentIntent(pendingIntent)
      .build()

    val notificationId = (System.currentTimeMillis() % Int.MAX_VALUE).toInt()
    notificationManager.notify(notificationId, notification)
  }

  private fun ensureChannel(manager: NotificationManagerCompat) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val channel = NotificationChannel(
      CHANNEL_ID,
      CHANNEL_NAME,
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = CHANNEL_DESCRIPTION
      enableLights(true)
      enableVibration(true)
    }

    manager.createNotificationChannel(channel)
  }

  private fun buildLaunchIntent(context: Context, address: String?): Intent {
    val uri = if (!address.isNullOrBlank()) {
      Uri.parse("smsforwarder://inbox/conversation/${Uri.encode(address)}")
    } else {
      Uri.parse("smsforwarder://inbox")
    }

    return Intent(Intent.ACTION_VIEW, uri).apply {
      setPackage(context.packageName)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
  }

  private fun resolveNotificationIcon(context: Context): Int {
    val defaultIcon = android.R.drawable.stat_notify_chat
    return context.applicationInfo.icon.takeIf { it != 0 } ?: defaultIcon
  }

  private fun pendingIntentFlags(): Int {
    val baseFlag = PendingIntent.FLAG_UPDATE_CURRENT
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      baseFlag or PendingIntent.FLAG_IMMUTABLE
    } else {
      baseFlag
    }
  }
}
