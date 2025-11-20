package com.smsforwarder.smslistener

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log

/**
 * BroadcastReceiver for handling incoming SMS messages.
 * Supports both manifest-registered (for background) and dynamically-registered (for foreground) modes.
 */
class SmsReceiver(private val module: ExpoSmsListenerModule? = null) : BroadcastReceiver() {

  companion object {
    private const val TAG = "SmsReceiver"
    private const val EVENT = "onSmsReceived"

    @Volatile
    private var staticModuleInstance: ExpoSmsListenerModule? = null

    fun setModuleInstance(module: ExpoSmsListenerModule?) {
      staticModuleInstance = module
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
      return
    }

    try {
      val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
      if (messages.isEmpty()) {
        Log.w(TAG, "Received empty SMS messages array")
        return
      }

      processMessages(messages)
    } catch (e: Exception) {
      Log.e(TAG, "Error processing SMS", e)
    }
  }

  private fun processMessages(messages: Array<SmsMessage>) {
    val firstMessage = messages[0]

    // Combine multipart messages into a single body
    val messageBody = if (messages.size == 1 || firstMessage.isReplace) {
      firstMessage.displayMessageBody ?: firstMessage.messageBody ?: ""
    } else {
      messages.joinToString("") { it.messageBody ?: "" }
    }

    sendSmsToReactNative(
      originatingAddress = firstMessage.originatingAddress ?: "Unknown",
      body = messageBody,
      timestamp = firstMessage.timestampMillis
    )
  }

  private fun sendSmsToReactNative(originatingAddress: String, body: String, timestamp: Long) {
    val bundle = Bundle().apply {
      putString("originatingAddress", originatingAddress)
      putString("body", body)
      putDouble("timestamp", timestamp.toDouble())
    }

    // Try to use the instance module first, then fall back to static instance
    val moduleToUse = module ?: staticModuleInstance

    if (moduleToUse != null) {
      moduleToUse.sendEventToJS(EVENT, bundle)
    } else {
      Log.e(TAG, "No module instance available - SMS received but not forwarded to React Native")
    }
  }
}
