package com.headless.aod.service

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import androidx.core.content.ContextCompat
import com.headless.aod.AODActivity

/**
 * Immortal Background Service for Samsung One UI / Android.
 *
 * Why AccessibilityService?
 * 1. Immune to aggressive One UI "app killing", background limits, and doze mode.
 * 2. Starts automatically on system boot once enabled by user.
 * 3. Deliberately exempted by Android OS from Background Activity Launch (BAL) restrictions,
 *    allowing immediate and reliable launch of AODActivity when the screen turns off.
 * 4. Zero runtime permissions needed—all native OS capabilities.
 */
class AodAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "AodAccessibilityService"
    }

    private var isReceiverRegistered = false

    private val screenOffReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_SCREEN_OFF) {
                Log.d(TAG, "Screen off event detected. Launching Headless AOD overlay.")
                launchAodActivity()
            }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "AodAccessibilityService connected to system_server.")
        registerScreenOffReceiver()
    }

    private fun registerScreenOffReceiver() {
        if (isReceiverRegistered) return

        val filter = IntentFilter(Intent.ACTION_SCREEN_OFF)
        // For Android 14+ (API 34+) compatibility with system broadcasts:
        ContextCompat.registerReceiver(
            this,
            screenOffReceiver,
            filter,
            ContextCompat.RECEIVER_EXPORTED
        )
        isReceiverRegistered = true
        Log.d(TAG, "ACTION_SCREEN_OFF receiver registered successfully.")
    }

    private fun unregisterScreenOffReceiver() {
        if (!isReceiverRegistered) return

        try {
            unregisterReceiver(screenOffReceiver)
            isReceiverRegistered = false
            Log.d(TAG, "ACTION_SCREEN_OFF receiver unregistered.")
        } catch (e: IllegalArgumentException) {
            Log.w(TAG, "Receiver was not registered or already removed: ${e.message}")
        }
    }

    private fun launchAodActivity() {
        val aodIntent = Intent(this, AODActivity::class.java).apply {
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP or
                Intent.FLAG_ACTIVITY_NO_ANIMATION
            )
        }
        startActivity(aodIntent)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // No-op: zero telemetry, zero event snooping, zero performance overhead.
    }

    override fun onInterrupt() {
        Log.w(TAG, "AodAccessibilityService interrupted.")
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterScreenOffReceiver()
        Log.i(TAG, "AodAccessibilityService destroyed.")
    }
}
