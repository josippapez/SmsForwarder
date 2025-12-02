package com.smsforwarder.rolemanager

import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.provider.Telephony
import android.app.role.RoleManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoRoleManagerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoRoleManager")

    AsyncFunction("getRoleStatus") {
      getRoleStatus()
    }

    AsyncFunction("requestRole") {
      requestRole()
    }

    AsyncFunction("openDefaultSmsSettings") {
      openDefaultSmsSettings()
    }
  }

  private fun reactContext(): Context =
    appContext.reactContext ?: throw IllegalStateException("React context is null")

  private fun roleManager(): RoleManager? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      reactContext().getSystemService(RoleManager::class.java)
    } else {
      null
    }

  private fun getRoleStatus(): Map<String, Any?> {
    val context = reactContext()
    val roleManager = roleManager()
    val currentDefault = Telephony.Sms.getDefaultSmsPackage(context)
    val isDefault = when {
      roleManager != null -> roleManager.isRoleHeld(RoleManager.ROLE_SMS)
      else -> currentDefault == context.packageName
    }
    val isAvailable = roleManager?.isRoleAvailable(RoleManager.ROLE_SMS)
      ?: (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q)

    return mapOf(
      "isAvailable" to isAvailable,
      "isDefault" to isDefault,
      "currentDefaultPackage" to currentDefault
    )
  }

  private fun requestRole(): Map<String, Any?> {
    val context = reactContext()
    val roleManager = roleManager()

    if (roleManager == null) {
      launchChangeDefaultIntent(context)
      return mapOf(
        "completed" to true,
        "isDefault" to (Telephony.Sms.getDefaultSmsPackage(context) == context.packageName)
      )
    }

    if (!roleManager.isRoleAvailable(RoleManager.ROLE_SMS)) {
      return mapOf(
        "completed" to false,
        "isDefault" to roleManager.isRoleHeld(RoleManager.ROLE_SMS)
      )
    }

    val activity = appContext.currentActivity ?: appContext.throwingActivity
    val requestIntent = roleManager.createRequestRoleIntent(RoleManager.ROLE_SMS)
    val canHandle = requestIntent.resolveActivity(activity.packageManager) != null

    if (canHandle) {
      activity.runOnUiThread {
        activity.startActivityForResult(requestIntent, ROLE_REQUEST_CODE)
      }
    } else {
      launchChangeDefaultIntent(context)
    }

    return mapOf(
      "completed" to true,
      "isDefault" to roleManager.isRoleHeld(RoleManager.ROLE_SMS)
    )
  }

  private fun openDefaultSmsSettings() {
    val context = reactContext()
    val manageDefaultsIntent = Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

    when {
      manageDefaultsIntent.resolveActivity(context.packageManager) != null ->
        context.startActivity(manageDefaultsIntent)
      else -> launchChangeDefaultIntent(context)
    }
  }

  private fun launchChangeDefaultIntent(context: Context) {
    val changeDefaultIntent = Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT).apply {
      putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, context.packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

    if (changeDefaultIntent.resolveActivity(context.packageManager) != null) {
      context.startActivity(changeDefaultIntent)
    }
  }

  companion object {
    private const val ROLE_REQUEST_CODE = 1010
  }
}
