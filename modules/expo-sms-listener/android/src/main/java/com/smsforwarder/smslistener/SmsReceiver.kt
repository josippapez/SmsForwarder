package com.smsforwarder.smslistener

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import java.util.LinkedHashMap

/**
 * BroadcastReceiver for handling incoming SMS messages.
 * Supports both manifest-registered (for background) and dynamically-registered (for foreground) modes.
 */
class SmsReceiver(private val module: ExpoSmsListenerModule? = null) : BroadcastReceiver() {

  companion object {
    private const val TAG = "SmsReceiver"
    private const val EVENT = "onSmsReceived"
    private const val DUP_WINDOW_MS = 10_000L
    private const val DUP_CACHE_LIMIT = 48

    @Volatile
    private var staticModuleInstance: ExpoSmsListenerModule? = null

    private val recentMessageRefs = object : LinkedHashMap<String, Long>(DUP_CACHE_LIMIT, 0.75f, true) {
      override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, Long>?): Boolean {
        return size > DUP_CACHE_LIMIT
      }
    }

    fun setModuleInstance(module: ExpoSmsListenerModule?) {
      staticModuleInstance = module
    }

    fun getModuleInstance(): ExpoSmsListenerModule? = staticModuleInstance

    @Synchronized
    private fun shouldProcessMessage(messageRef: String?): Boolean {
      if (messageRef.isNullOrBlank()) {
        return true
      }

      val now = System.currentTimeMillis()
      val previous = recentMessageRefs[messageRef]
      return if (previous != null && now - previous < DUP_WINDOW_MS) {
        false
      } else {
        recentMessageRefs[messageRef] = now
        true
      }
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action
    val isReceivedAction = action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION
    val isDeliverAction = action == Telephony.Sms.Intents.SMS_DELIVER_ACTION

    if (!isReceivedAction && !isDeliverAction) {
      return
    }

    if (isReceivedAction && isDefaultSmsApp(context)) {
      Log.d(TAG, "Skipping SMS_RECEIVED broadcast because app is default handler")
      return
    }

    try {
      val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
      if (messages.isEmpty()) {
        Log.w(TAG, "Received empty SMS messages array")
        return
      }

      processMessages(context, intent, messages)
      if (isDeliverAction) {
        resultCode = Activity.RESULT_OK
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error processing SMS", e)
    }
  }

  private fun processMessages(
    context: Context,
    intent: Intent,
    messages: Array<SmsMessage>
  ) {
    val bundle = SmsEventBuilder.bundleFromMessages(context, intent, messages)
    if (!Companion.shouldProcessMessage(bundle.getString("messageRef"))) {
      Log.d(TAG, "Skipping duplicate SMS event")
      return
    }

    val address = messages.firstOrNull()?.displayOriginatingAddress
      ?: bundle.getString("originatingAddress")

    if (ContactPreferences.isBlocked(context, address)) {
      Log.d(TAG, "Ignoring SMS from blocked address: $address")
      return
    }

    sendBundleToReactNative(bundle)
    val preview = buildPreview(messages, bundle.getString("body"))
    if (!ContactPreferences.isMuted(context, address)) {
      SmsNotificationHelper.showIncomingNotification(context, address, preview)
    }
  }

  private fun buildPreview(messages: Array<SmsMessage>, fallback: String?): String {
    val body = messages.joinToString(separator = "") { sms ->
      sms.displayMessageBody ?: sms.messageBody ?: ""
    }

    return if (body.isNotBlank()) body else fallback ?: ""
  }

  private fun sendBundleToReactNative(bundle: Bundle) {
    val moduleToUse = module ?: staticModuleInstance

    if (moduleToUse != null) {
      moduleToUse.sendEventToJS(EVENT, bundle)
    } else {
      Log.e(TAG, "No module instance available - SMS received but not forwarded to React Native")
    }
  }

  private fun isDefaultSmsApp(context: Context): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      Telephony.Sms.getDefaultSmsPackage(context) == context.packageName
    } else {
      false
    }
  }
}
