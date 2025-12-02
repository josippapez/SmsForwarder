package com.smsforwarder.smslistener

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Telephony
import android.util.Base64
import android.util.Log

/**
 * Minimal MMS/WAP push receiver so the app can satisfy the default SMS handler contract.
 * For now it only acknowledges delivery and surfaces metadata for future processing.
 */
class MmsWapPushReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    if (
      action != Telephony.Sms.Intents.WAP_PUSH_DELIVER_ACTION &&
      action != Telephony.Sms.Intents.WAP_PUSH_RECEIVED_ACTION
    ) {
      return
    }

    try {
      val extras = intent.extras ?: Bundle.EMPTY
      val rawDataLength = extras.getByteArray("data")?.size ?: 0
      Log.d(TAG, "Received WAP push intent=$action with payloadSize=$rawDataLength")
      emitMmsEvent(context, extras)
      // For MMS we currently just acknowledge to let the platform store the PDU.
      resultCode = Activity.RESULT_OK
    } catch (e: Exception) {
      Log.e(TAG, "Error handling WAP push", e)
    }
  }

  private fun emitMmsEvent(context: Context, extras: Bundle) {
    val module = SmsReceiver.getModuleInstance() ?: run {
      Log.w(TAG, "No module instance available for MMS event")
      return
    }

    val rawPdu = extras.getByteArray("data")
    val base64Pdu = rawPdu?.let { Base64.encodeToString(it, Base64.NO_WRAP) }
    val metadata = Bundle().apply {
      extras.keySet().forEach { key ->
        when (val value = extras.get(key)) {
          is String -> putString(key, value)
          is Int -> putInt(key, value)
          is Long -> putLong(key, value)
          is ByteArray -> putString(key, Base64.encodeToString(value, Base64.NO_WRAP))
        }
      }
    }

    val bundle = Bundle().apply {
      putString("originatingAddress", extras.getString("address") ?: "Unknown")
      putString("body", "[MMS] ${rawPdu?.size ?: 0} bytes")
      putDouble("timestamp", System.currentTimeMillis().toDouble())
      putString("box", "inbox")
      putString("type", "mms")
      base64Pdu?.let { putString("rawPdu", it) }
      if (!metadata.isEmpty) {
        putBundle("metadata", metadata)
      }
    }

    val address = bundle.getString("originatingAddress")
    if (ContactPreferences.isBlocked(context, address)) {
      Log.d(TAG, "Ignoring MMS from blocked address: $address")
      return
    }

    module.sendEventToJS("onMmsReceived", bundle)
    if (!ContactPreferences.isMuted(context, address)) {
      SmsNotificationHelper.showIncomingNotification(
        context,
        address,
        bundle.getString("body")
      )
    }
  }

  companion object {
    private const val TAG = "MmsWapPushReceiver"
  }
}
