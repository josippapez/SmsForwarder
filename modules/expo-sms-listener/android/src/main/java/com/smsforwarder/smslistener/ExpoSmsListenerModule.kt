package com.smsforwarder.smslistener

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoSmsListenerModule : Module() {
  private var receiver: SmsReceiver? = null
  private var isReceiverRegistered = false

  override fun definition() = ModuleDefinition {
    Name("ExpoSmsListener")

    Events("onSmsReceived")

    OnCreate {
      receiver = SmsReceiver(this@ExpoSmsListenerModule)
      registerReceiverIfNecessary()
    }

    OnDestroy {
      unregisterReceiver()
    }

    OnActivityEntersForeground {
      registerReceiverIfNecessary()
    }

    OnActivityEntersBackground {
      // Keep receiver running in background
    }

    Function("stopService") {
      Log.d("ExpoSmsListener", "stopService called")
      unregisterReceiver()
    }
  }

  private fun registerReceiverIfNecessary() {
    val context = appContext.reactContext ?: return

    if (!isReceiverRegistered) {
      try {
        val filter = android.content.IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
        context.registerReceiver(receiver, filter)
        isReceiverRegistered = true
        Log.d("ExpoSmsListener", "Receiver registered successfully")
      } catch (e: Exception) {
        Log.e("ExpoSmsListener", "Failed to register receiver", e)
      }
    }
  }

  private fun unregisterReceiver() {
    val context = appContext.reactContext ?: return

    if (isReceiverRegistered) {
      try {
        context.unregisterReceiver(receiver)
        isReceiverRegistered = false
        Log.d("ExpoSmsListener", "Receiver unregistered")
      } catch (e: Exception) {
        Log.e("ExpoSmsListener", "Failed to unregister receiver", e)
      }
    }
  }

  fun sendEventToJS(eventName: String, params: Bundle) {
    sendEvent(eventName, params)
  }
}
