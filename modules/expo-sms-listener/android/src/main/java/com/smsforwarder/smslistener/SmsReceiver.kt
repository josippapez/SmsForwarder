package com.smsforwarder.smslistener

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log

class SmsReceiver(private val module: ExpoSmsListenerModule) : BroadcastReceiver() {

  companion object {
    private const val TAG = "SmsReceiver"
    private const val EVENT = "onSmsReceived"
  }

  override fun onReceive(context: Context, intent: Intent) {
    val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
    receiveMultipartMessage(messages)
  }

  private fun receiveMultipartMessage(messages: Array<SmsMessage>) {
    if (messages.isEmpty()) return

    val sms = messages[0]
    val body = if (messages.size == 1 || sms.isReplace) {
      sms.displayMessageBody
    } else {
      messages.joinToString("") { it.messageBody }
    }

    receiveMessage(sms, body)
  }

  private fun receiveMessage(message: SmsMessage, body: String) {
    Log.d(TAG, "${message.originatingAddress}: $body")

    val bundle = Bundle().apply {
      putString("originatingAddress", message.originatingAddress)
      putString("body", body.ifEmpty { message.messageBody })
      putDouble("timestamp", message.timestampMillis.toDouble())
    }

    module.sendEventToJS(EVENT, bundle)
  }
}
