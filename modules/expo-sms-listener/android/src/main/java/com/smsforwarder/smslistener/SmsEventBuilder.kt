package com.smsforwarder.smslistener

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.telephony.SmsMessage
import android.telephony.SubscriptionManager
import android.util.Base64
import android.util.Log
import java.util.ArrayList

object SmsEventBuilder {
  private const val TAG = "SmsEventBuilder"

  fun bundleFromMessages(
    context: Context,
    intent: Intent?,
    messages: Array<SmsMessage>
  ): Bundle {
    val firstMessage = messages.first()
    val body = buildMessageBody(messages, firstMessage)
    val subscriptionId = extractSubscriptionId(intent)
    val slotIndex = resolveSlotIndex(context, subscriptionId)
    val encodedPdus = collectEncodedPdus(messages)
    val metadata = buildMetadataBundle(firstMessage, encodedPdus)
    val messageRef = buildMessageRef(firstMessage, body)

    return Bundle().apply {
      putString("originatingAddress", firstMessage.originatingAddress ?: "Unknown")
      putString("body", body)
      putDouble("timestamp", firstMessage.timestampMillis.toDouble())
      putString("box", "inbox")
      putString("type", "sms")
      subscriptionId?.let { putInt("subscriptionId", it) }
      slotIndex?.let { putInt("simSlotIndex", it) }
      messageRef?.let { putString("messageRef", it) }
      encodedPdus.firstOrNull()?.let { putString("rawPdu", it) }
      metadata?.let { putBundle("metadata", it) }
    }
  }

  private fun buildMessageBody(
    messages: Array<SmsMessage>,
    firstMessage: SmsMessage
  ): String {
    return if (messages.size == 1 || firstMessage.isReplace) {
      firstMessage.displayMessageBody ?: firstMessage.messageBody ?: ""
    } else {
      messages.joinToString(separator = "") { it.messageBody ?: "" }
    }
  }

  private fun collectEncodedPdus(messages: Array<SmsMessage>): List<String> {
    return messages.mapNotNull { sms ->
      sms.pdu?.let { Base64.encodeToString(it, Base64.NO_WRAP) }
    }
  }

  private fun buildMetadataBundle(
    firstMessage: SmsMessage,
    encodedPdus: List<String>
  ): Bundle? {
    val metadata = Bundle()
    firstMessage.serviceCenterAddress?.let { metadata.putString("serviceCenterAddress", it) }
    if (encodedPdus.isNotEmpty()) {
      metadata.putStringArrayList("pdus", ArrayList(encodedPdus))
    }

    return metadata.takeIf { !it.isEmpty }
  }

  private fun buildMessageRef(message: SmsMessage, body: String): String {
    val timestampPart = message.timestampMillis
    val addressPart = message.originatingAddress ?: "unknown"
    val bodyHash = body.hashCode()
    val pduHash = message.pdu?.contentHashCode() ?: 0
    return "$timestampPart:$addressPart:$bodyHash:$pduHash"
  }

  private fun extractSubscriptionId(intent: Intent?): Int? {
    val fromIntent = intent?.getIntExtra(
      "subscription",
      SubscriptionManager.INVALID_SUBSCRIPTION_ID
    ) ?: SubscriptionManager.INVALID_SUBSCRIPTION_ID

    if (fromIntent != SubscriptionManager.INVALID_SUBSCRIPTION_ID) {
      return fromIntent
    }

    // SmsMessage#subscriptionId is hidden on some API levels, so we avoid referencing it directly
    // and fall back to whatever the platform stored on the intent bundle.
    return null
  }

  private fun resolveSlotIndex(context: Context, subscriptionId: Int?): Int? {
    if (subscriptionId == null || subscriptionId == SubscriptionManager.INVALID_SUBSCRIPTION_ID) {
      return null
    }

    val slotIndex = try {
      val manager = context.getSystemService(SubscriptionManager::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        manager?.getActiveSubscriptionInfo(subscriptionId)?.simSlotIndex
      } else {
        @Suppress("DEPRECATION")
        SubscriptionManager.getSlotIndex(subscriptionId)
      }
    } catch (error: Exception) {
      Log.w(TAG, "Unable to resolve SIM slot index", error)
      null
    }

    return if (
      slotIndex != null &&
      slotIndex != SubscriptionManager.INVALID_SIM_SLOT_INDEX
    ) {
      slotIndex
    } else {
      null
    }
  }
}
