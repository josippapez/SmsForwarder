package com.smsforwarder.smslistener

import android.content.Context
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import android.provider.Telephony
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo module for listening to incoming SMS messages.
 * Registers a broadcast receiver both dynamically (for foreground) and via manifest (for background).
 */
class ExpoSmsListenerModule : Module() {
  private var receiver: SmsReceiver? = null
  private var isReceiverRegistered = false

  override fun definition() = ModuleDefinition {
    Name("ExpoSmsListener")

    Events("onSmsReceived", "onMmsReceived", "onRespondViaMessage")

    OnCreate {
      receiver = SmsReceiver(this@ExpoSmsListenerModule)
      SmsReceiver.setModuleInstance(this@ExpoSmsListenerModule)
      registerReceiverIfNecessary()
    }

    OnDestroy {
      SmsReceiver.setModuleInstance(null)
      unregisterReceiver()
    }

    OnActivityEntersForeground {
      SmsReceiver.setModuleInstance(this@ExpoSmsListenerModule)
      registerReceiverIfNecessary()
    }

    OnActivityEntersBackground {
      // Keep manifest-registered receiver running in background
      // Dynamic receiver stays active as well
    }

    Function("startService") {
      SmsReceiver.setModuleInstance(this@ExpoSmsListenerModule)
      registerReceiverIfNecessary()
    }

    Function("stopService") {
      SmsReceiver.setModuleInstance(null)
      unregisterReceiver()
    }

    Function("setContactMuted") { address: String, muted: Boolean ->
      val context = appContext.reactContext ?: return@Function false
      ContactPreferences.setMuted(context, address, muted)
      true
    }

    Function("setContactBlocked") { address: String, blocked: Boolean ->
      val context = appContext.reactContext ?: return@Function false
      ContactPreferences.setBlocked(context, address, blocked)
      true
    }

    Function("isContactMuted") { address: String ->
      val context = appContext.reactContext ?: return@Function false
      ContactPreferences.isMuted(context, address)
    }

    Function("isContactBlocked") { address: String ->
      val context = appContext.reactContext ?: return@Function false
      ContactPreferences.isBlocked(context, address)
    }
  }

  private fun registerReceiverIfNecessary() {
    if (isReceiverRegistered) return

    val context = appContext.reactContext ?: return

    try {
      val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION).apply {
        addAction(Telephony.Sms.Intents.SMS_DELIVER_ACTION)
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
      } else {
        context.registerReceiver(receiver, filter)
      }

      isReceiverRegistered = true
    } catch (e: Exception) {
      Log.e(TAG, "Failed to register SMS receiver", e)
    }
  }

  private fun unregisterReceiver() {
    if (!isReceiverRegistered) return

    val context = appContext.reactContext ?: return

    try {
      context.unregisterReceiver(receiver)
      isReceiverRegistered = false
    } catch (e: Exception) {
      Log.e(TAG, "Failed to unregister SMS receiver", e)
    }
  }

  fun sendEventToJS(eventName: String, params: Bundle) {
    sendEvent(eventName, params)
  }

  companion object {
    private const val TAG = "ExpoSmsListener"
  }
}
