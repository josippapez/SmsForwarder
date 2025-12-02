package com.smsforwarder.smslistener

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.os.Bundle
import android.telephony.TelephonyManager
import android.util.Log

/**
 * Service invoked by the system when the user replies to messages from system UIs (e.g. call screen UI).
 * The implementation is a placeholder for now and will be extended to send replies via the JS pipeline.
 */
class DefaultSmsHeadlessSendService : Service() {
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == TelephonyManager.ACTION_RESPOND_VIA_MESSAGE) {
      val targetAddress = intent.data?.schemeSpecificPart.orEmpty()
      val messageBody = intent.getStringExtra(Intent.EXTRA_TEXT).orEmpty()
      Log.d(TAG, "Respond-via-message request for $targetAddress messageLength=${messageBody.length}")
      emitRespondEvent(targetAddress, messageBody, intent)
    }
    stopSelf(startId)
    return START_NOT_STICKY
  }

  private fun emitRespondEvent(targetAddress: String, body: String, intent: Intent) {
    val module = SmsReceiver.getModuleInstance() ?: run {
      Log.w(TAG, "No module instance available for respond-via-message event")
      return
    }

    val metadata = Bundle().apply {
      intent.extras?.keySet()?.forEach { key ->
        val value = intent.extras?.get(key)
        when (value) {
          is String -> putString(key, value)
          is Int -> putInt(key, value)
          is Long -> putLong(key, value)
        }
      }
    }

    val bundle = Bundle().apply {
      putString("targetAddress", targetAddress)
      putString("body", body)
      putDouble("timestamp", System.currentTimeMillis().toDouble())
      if (!metadata.isEmpty) {
        putBundle("metadata", metadata)
      }
    }

    module.sendEventToJS("onRespondViaMessage", bundle)
  }

  override fun onBind(intent: Intent?): IBinder? = null

  companion object {
    private const val TAG = "HeadlessSmsSendSvc"
  }
}
