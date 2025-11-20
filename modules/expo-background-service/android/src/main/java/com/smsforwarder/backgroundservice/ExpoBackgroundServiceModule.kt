package com.smsforwarder.backgroundservice

import android.content.Intent
import android.os.Bundle
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBackgroundServiceModule : Module() {
  private var currentServiceIntent: Intent? = null

  private val context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is null")

  override fun definition() = ModuleDefinition {
    Name("ExpoBackgroundService")

    Function("startService") {
      currentServiceIntent?.let { context.stopService(it) }

      currentServiceIntent = Intent(context, BackgroundService::class.java)

      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
        context.startForegroundService(currentServiceIntent)
      } else {
        context.startService(currentServiceIntent)
      }
    }

    Function("stopService") {
      currentServiceIntent?.let {
        context.stopService(it)
        currentServiceIntent = null
      }
    }
  }
}
