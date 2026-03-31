package com.fil.instasort

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle

class ShareReceiverActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    forwardShareIntent(intent)
    finish()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    forwardShareIntent(intent)
    finish()
  }

  private fun forwardShareIntent(intent: Intent) {
    val sharedText = extractSharedText(intent)
    val sharedUrl = extractFirstUrl(sharedText)
    val deepLink = Uri.parse("instasort:///handle-share").buildUpon().apply {
      if (!sharedUrl.isNullOrBlank()) {
        appendQueryParameter("sharedUrl", sharedUrl)
      }

      if (!sharedText.isNullOrBlank()) {
        appendQueryParameter("text", sharedText)
      }
    }.build()

    val targetIntent = Intent(Intent.ACTION_VIEW, deepLink, this, MainActivity::class.java).apply {
      addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_SINGLE_TOP
      )
    }

    startActivity(targetIntent)
  }

  private fun extractSharedText(intent: Intent): String {
    intent.getStringExtra(Intent.EXTRA_TEXT)?.trim()?.takeIf { it.isNotEmpty() }?.let {
      return it
    }

    intent.getCharSequenceExtra(Intent.EXTRA_TEXT)?.toString()?.trim()?.takeIf { it.isNotEmpty() }?.let {
      return it
    }

    intent.getStringExtra(Intent.EXTRA_SUBJECT)?.trim()?.takeIf { it.isNotEmpty() }?.let {
      return it
    }

    intent.dataString?.trim()?.takeIf { it.isNotEmpty() }?.let {
      return it
    }

    val clipData = intent.clipData

    if (clipData != null) {
      val values = mutableListOf<String>()

      for (index in 0 until clipData.itemCount) {
        val item = clipData.getItemAt(index)
        item.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }?.let(values::add)
        item.uri?.toString()?.trim()?.takeIf { it.isNotEmpty() }?.let(values::add)
      }

      if (values.isNotEmpty()) {
        return values.joinToString("\n")
      }
    }

    return ""
  }

  private fun extractFirstUrl(value: String): String {
    val match = Regex("""https?://\S+""", RegexOption.IGNORE_CASE).find(value)
    return match?.value?.trim()?.trimEnd('.', ',', ';', ')', ']') ?: ""
  }
}
