package com.smsforwarder.smslistener

import android.net.Uri
import android.content.Intent
import android.os.Build
import android.service.carrier.CarrierMessagingService
import android.service.carrier.MessagePdu
import android.telephony.SmsMessage
import android.util.Log

/**
 * Skeleton carrier messaging service to satisfy the default SMS handler contract.
 * Each callback currently defers to the system by returning success immediately.
 */
class SmsCarrierMessagingService : CarrierMessagingService() {
  override fun onReceiveTextSms(
    pdu: MessagePdu,
    format: String,
    destPort: Int,
    subId: Int,
    callback: ResultCallback<Int>
  ) {
    Log.d(TAG, "onReceiveTextSms subId=$subId format=$format destPort=$destPort parts=${pdu.pdus?.size ?: 0}")
    emitSmsEvent(pdu, format, subId)
    callback.onReceiveResult(RECEIVE_OPTIONS_DEFAULT)
  }

  override fun onSendTextSms(
    text: String,
    subId: Int,
    destAddress: String,
    sendSmsFlag: Int,
    callback: ResultCallback<SendSmsResult>
  ) {
    Log.d(TAG, "onSendTextSms dest=$destAddress subId=$subId")
    callback.onReceiveResult(SendSmsResult(SEND_STATUS_OK, /*messageRef*/ 0))
  }

  override fun onSendMultipartTextSms(
    parts: MutableList<String>,
    subId: Int,
    destAddress: String,
    sendSmsFlag: Int,
    callback: ResultCallback<SendMultipartSmsResult>
  ) {
    Log.d(TAG, "onSendMultipartTextSms parts=${parts.size} dest=$destAddress subId=$subId")
    val refs = IntArray(parts.size)
    callback.onReceiveResult(SendMultipartSmsResult(SEND_STATUS_OK, refs))
  }

  override fun onSendDataSms(
    data: ByteArray,
    subId: Int,
    destAddress: String,
    destPort: Int,
    sendSmsFlag: Int,
    callback: ResultCallback<SendSmsResult>
  ) {
    Log.d(TAG, "onSendDataSms bytes=${data.size} dest=$destAddress:$destPort subId=$subId")
    callback.onReceiveResult(SendSmsResult(SEND_STATUS_OK, /*messageRef*/ 0))
  }

  override fun onSendMms(
    pduUri: Uri,
    subId: Int,
    locationUri: Uri?,
    callback: ResultCallback<SendMmsResult>
  ) {
    Log.d(TAG, "onSendMms subId=$subId location=$locationUri pduUri=$pduUri")
    callback.onReceiveResult(SendMmsResult(SEND_STATUS_OK, null))
  }

  override fun onDownloadMms(
    contentUri: Uri,
    subId: Int,
    location: Uri,
    callback: ResultCallback<Int>
  ) {
    Log.d(TAG, "onDownloadMms subId=$subId location=$location contentUri=$contentUri")
    callback.onReceiveResult(DOWNLOAD_STATUS_OK)
  }

  companion object {
    private const val TAG = "SmsCarrierMessaging"
  }

  private fun emitSmsEvent(messagePdu: MessagePdu, format: String, subId: Int) {
    val module = SmsReceiver.getModuleInstance() ?: run {
      Log.w(TAG, "No module instance available for carrier SMS event")
      return
    }

    val smsMessages = messagePdu.pdus?.mapNotNull { pduBytes ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        SmsMessage.createFromPdu(pduBytes, format)
      } else {
        @Suppress("DEPRECATION")
        SmsMessage.createFromPdu(pduBytes)
      }
    }?.toTypedArray() ?: emptyArray()

    if (smsMessages.isEmpty()) {
      Log.w(TAG, "Carrier service received empty PDUs")
      return
    }

    val stubIntent = Intent().apply {
      putExtra("subscription", subId)
    }

    val bundle = SmsEventBuilder.bundleFromMessages(applicationContext, stubIntent, smsMessages)
    module.sendEventToJS("onSmsReceived", bundle)
  }
}
