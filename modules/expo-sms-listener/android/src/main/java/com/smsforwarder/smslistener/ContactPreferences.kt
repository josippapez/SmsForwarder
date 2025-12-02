package com.smsforwarder.smslistener

import android.content.Context

object ContactPreferences {
  private const val PREFS_NAME = "smsforwarder_contact_prefs"
  private const val BLOCKED_KEY = "blocked_addresses"
  private const val MUTED_KEY = "muted_addresses"

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun setBlocked(context: Context, address: String, blocked: Boolean) {
    updateSet(context, BLOCKED_KEY, address, blocked)
  }

  fun setMuted(context: Context, address: String, muted: Boolean) {
    updateSet(context, MUTED_KEY, address, muted)
  }

  fun isBlocked(context: Context, address: String?): Boolean {
    if (address.isNullOrBlank()) return false
    return getSet(context, BLOCKED_KEY).contains(normalize(address))
  }

  fun isMuted(context: Context, address: String?): Boolean {
    if (address.isNullOrBlank()) return false
    return getSet(context, MUTED_KEY).contains(normalize(address))
  }

  fun getBlocked(context: Context): Set<String> = getSet(context, BLOCKED_KEY)

  fun getMuted(context: Context): Set<String> = getSet(context, MUTED_KEY)

  private fun updateSet(
    context: Context,
    key: String,
    address: String,
    shouldInclude: Boolean
  ) {
    val normalized = normalize(address)
    if (normalized.isEmpty()) return
    val prefs = prefs(context)
    val current = HashSet(prefs.getStringSet(key, emptySet()) ?: emptySet())

    if (shouldInclude) {
      current.add(normalized)
    } else {
      current.remove(normalized)
    }

    prefs.edit().putStringSet(key, current).apply()
  }

  private fun getSet(context: Context, key: String): Set<String> {
    val prefs = prefs(context)
    return prefs.getStringSet(key, emptySet()) ?: emptySet()
  }

  private fun normalize(address: String): String = address.trim().lowercase()
}
