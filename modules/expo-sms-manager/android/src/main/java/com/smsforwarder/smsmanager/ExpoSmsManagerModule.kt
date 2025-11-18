package com.smsforwarder.smsmanager

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.database.Cursor
import android.net.Uri
import android.telephony.SmsManager
import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject

class ExpoSmsManagerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is null")

  override fun definition() = ModuleDefinition {
    Name("ExpoSmsManager")

    AsyncFunction("list") { filter: String, promise: Promise ->
      try {
        val filterJ = JSONObject(filter)
        val uriFilter = if (filterJ.has("box")) filterJ.optString("box") else "inbox"
        val fread = if (filterJ.has("read")) filterJ.optInt("read") else -1
        val fid = if (filterJ.has("_id")) filterJ.optInt("_id") else -1
        val ftid = if (filterJ.has("thread_id")) filterJ.optInt("thread_id") else -1
        val faddress = filterJ.optString("address", "")
        val fcontent = filterJ.optString("body", "")
        val fContentRegex = filterJ.optString("bodyRegex", "")
        val indexFrom = if (filterJ.has("indexFrom")) filterJ.optInt("indexFrom") else 0
        val maxCount = if (filterJ.has("maxCount")) filterJ.optInt("maxCount") else -1
        val selection = filterJ.optString("selection", "")
        val sortOrder = if (filterJ.has("sortOrder")) filterJ.optString("sortOrder") else null
        val maxDate = if (filterJ.has("maxDate")) filterJ.optLong("maxDate") else -1L
        val minDate = if (filterJ.has("minDate")) filterJ.optLong("minDate") else -1L

        val cursor = context.contentResolver.query(
          Uri.parse("content://sms/$uriFilter"),
          null,
          if (selection.isNotEmpty()) selection else null,
          null,
          sortOrder
        )

        var c = 0
        val jsons = JSONArray()

        cursor?.use {
          while (it.moveToNext()) {
            var matchFilter = true

            if (fid > -1) {
              matchFilter = fid == it.getInt(it.getColumnIndexOrThrow("_id"))
            } else if (ftid > -1) {
              matchFilter = ftid == it.getInt(it.getColumnIndexOrThrow("thread_id"))
            } else if (fread > -1) {
              matchFilter = fread == it.getInt(it.getColumnIndexOrThrow("read"))
            } else if (faddress.isNotEmpty()) {
              matchFilter = faddress == it.getString(it.getColumnIndexOrThrow("address")).trim()
            } else if (fcontent.isNotEmpty()) {
              matchFilter = fcontent == it.getString(it.getColumnIndexOrThrow("body")).trim()
            }

            if (fContentRegex.isNotEmpty()) {
              val body = it.getString(it.getColumnIndexOrThrow("body"))
              matchFilter = matchFilter && body.matches(Regex(fContentRegex))
            }

            if (maxDate > -1) {
              matchFilter = matchFilter && maxDate >= it.getLong(it.getColumnIndexOrThrow("date"))
            }

            if (minDate > -1) {
              matchFilter = matchFilter && minDate <= it.getLong(it.getColumnIndexOrThrow("date"))
            }

            if (matchFilter) {
              if (c >= indexFrom) {
                if (maxCount > 0 && c >= indexFrom + maxCount) break
                val json = getJsonFromCursor(it)
                jsons.put(json)
              }
              c++
            }
          }
        }

        val result = JSONObject().apply {
          put("count", c)
          put("messages", jsons.toString())
        }
        promise.resolve(result.toString())
      } catch (e: Exception) {
        promise.reject("SMS_LIST_ERROR", e.message, e)
      }
    }

    AsyncFunction("autoSend") { phoneNumber: String, message: String, promise: Promise ->
      try {
        val SENT = "SMS_SENT"
        val DELIVERED = "SMS_DELIVERED"

        val sentPI = PendingIntent.getBroadcast(
          context,
          0,
          Intent(SENT),
          PendingIntent.FLAG_IMMUTABLE
        )
        val deliveredPI = PendingIntent.getBroadcast(
          context,
          0,
          Intent(DELIVERED),
          PendingIntent.FLAG_IMMUTABLE
        )

        context.registerReceiver(object : BroadcastReceiver() {
          override fun onReceive(context: Context, intent: Intent) {
            when (resultCode) {
              Activity.RESULT_OK -> promise.resolve("SMS sent")
              SmsManager.RESULT_ERROR_GENERIC_FAILURE -> promise.reject("SMS_ERROR", "Generic failure", null)
              SmsManager.RESULT_ERROR_NO_SERVICE -> promise.reject("SMS_ERROR", "No service", null)
              SmsManager.RESULT_ERROR_NULL_PDU -> promise.reject("SMS_ERROR", "Null PDU", null)
              SmsManager.RESULT_ERROR_RADIO_OFF -> promise.reject("SMS_ERROR", "Radio off", null)
            }
            context.unregisterReceiver(this)
          }
        }, IntentFilter(SENT))

        val smsManager = SmsManager.getDefault()
        val parts = smsManager.divideMessage(message)
        val sentPendingIntents = ArrayList<PendingIntent>(parts.size)
        val deliveredPendingIntents = ArrayList<PendingIntent>(parts.size)

        for (i in parts.indices) {
          sentPendingIntents.add(sentPI)
          deliveredPendingIntents.add(deliveredPI)
        }

        smsManager.sendMultipartTextMessage(
          phoneNumber,
          null,
          parts,
          sentPendingIntents,
          deliveredPendingIntents
        )

        val values = ContentValues().apply {
          put("address", phoneNumber)
          put("body", message)
        }
        context.contentResolver.insert(Uri.parse("content://sms/sent"), values)
      } catch (e: Exception) {
        promise.reject("SMS_SEND_ERROR", e.message, e)
      }
    }

    AsyncFunction("delete") { id: Int, promise: Promise ->
      try {
        val res = context.contentResolver.delete(
          Uri.parse("content://sms/$id"),
          null,
          null
        )
        if (res > 0) {
          promise.resolve("OK")
        } else {
          promise.reject("SMS_DELETE_ERROR", "SMS not found", null)
        }
      } catch (e: Exception) {
        promise.reject("SMS_DELETE_ERROR", e.message, e)
      }
    }
  }

  private fun getJsonFromCursor(cursor: Cursor): JSONObject {
    val json = JSONObject()
    val columnCount = cursor.columnCount
    val keys = cursor.columnNames

    for (j in 0 until columnCount) {
      val key = keys[j]
      when (cursor.getType(j)) {
        Cursor.FIELD_TYPE_NULL -> json.put(key, JSONObject.NULL)
        Cursor.FIELD_TYPE_INTEGER -> json.put(key, cursor.getLong(j))
        Cursor.FIELD_TYPE_FLOAT -> json.put(key, cursor.getFloat(j))
        Cursor.FIELD_TYPE_STRING -> json.put(key, cursor.getString(j))
        Cursor.FIELD_TYPE_BLOB -> json.put(key, cursor.getBlob(j))
      }
    }

    return json
  }
}
