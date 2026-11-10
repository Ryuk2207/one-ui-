package com.headless.aod

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import kotlin.math.abs
import kotlin.random.Random

/**
 * Headless Always On Display (AOD) Activity for Samsung Galaxy A16 (One UI 6–9).
 *
 * New Features:
 * 1. Minimal Battery Percentage: Listens to Intent.ACTION_BATTERY_CHANGED (lightweight, zero polling).
 * 2. Samsung One UI Lock Screen Clock Styles:
 *    - Style 0: Standard Horizontal (HH:mm)
 *    - Style 1: Signature One UI Stacked (Hours stacked on top of Minutes)
 * 3. Free Position Placement in ANY Space of Display:
 *    - Drag the clock anywhere on the screen to relocate it. Position is persisted in SharedPreferences.
 *    - Burn-in protection (±15px jitter every 5 minutes) operates relative to the customized user position.
 * 4. Wake Gesture: Double-tap anywhere to dismiss and reveal native lock screen.
 */
class AODActivity : AppCompatActivity() {

    companion object {
        const val PREFS_NAME = "aod_preferences"
        const val KEY_POS_X_RATIO = "clock_pos_x_ratio"
        const val KEY_POS_Y_RATIO = "clock_pos_y_ratio"
        const val KEY_CLOCK_STYLE = "clock_style" // 0: Horizontal, 1: Stacked

        const val STYLE_HORIZONTAL = 0
        const val STYLE_STACKED = 1
    }

    private lateinit var rootLayout: View
    private lateinit var clockContainer: LinearLayout
    private lateinit var tvTimeHorizontal: TextView
    private lateinit var layoutTimeStacked: LinearLayout
    private lateinit var tvHoursStacked: TextView
    private lateinit var tvMinutesStacked: TextView
    private lateinit var tvDate: TextView
    private lateinit var tvBattery: TextView
    private lateinit var tvAodTip: TextView

    private val timeFormatHours = SimpleDateFormat("HH", Locale.getDefault())
    private val timeFormatMinutes = SimpleDateFormat("mm", Locale.getDefault())
    private val dateFormat = SimpleDateFormat("EEE, MMM d", Locale.getDefault())

    private lateinit var prefs: SharedPreferences
    private var currentClockStyle = STYLE_HORIZONTAL

    // Positioning and dragging coordinates
    private var customBaseX = 0f
    private var customBaseY = 0f
    private var burnInDeltaX = 0f
    private var burnInDeltaY = 0f
    private var isPositionInitialized = false

    private var isTimeTickRegistered = false
    private var isBatteryReceiverRegistered = false
    private var lastShiftMinute = -1

    // Drag-to-reposition touch tracking
    private var touchDownX = 0f
    private var touchDownY = 0f
    private var initialContainerX = 0f
    private var initialContainerY = 0f
    private var isDraggingClock = false
    private val tipHandler = Handler(Looper.getMainLooper())

    // Double-tap detector for screen wake/dismiss
    private val gestureDetector by lazy {
        GestureDetector(this, object : GestureDetector.SimpleOnGestureListener() {
            override fun onDown(e: MotionEvent): Boolean = true

            override fun onDoubleTap(e: MotionEvent): Boolean {
                dismissAod()
                return true
            }

            override fun onLongPress(e: MotionEvent) {
                // Long press on clock toggles between One UI lockscreen clock styles!
                cycleClockStyle()
            }
        })
    }

    // Listens to Android system clock tick (broadcast once per minute by OS alarm)
    private val timeTickReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_TIME_TICK) {
                updateClockDisplay()
                checkAndApplyBurnInShift()
            }
        }
    }

    // Listens to Android battery state changes (lightweight system callback, no polling)
    private val batteryReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_BATTERY_CHANGED) {
                updateBatteryDisplay(intent)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configureWindow()
        setContentView(R.layout.activity_aod)

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        currentClockStyle = prefs.getInt(KEY_CLOCK_STYLE, STYLE_HORIZONTAL)

        initViews()
        setupDraggableClock()
        applyClockStyle(currentClockStyle)
        updateClockDisplay()
    }

    private fun configureWindow() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // 5% hardware brightness clamp
        val layoutParams = window.attributes
        layoutParams.screenBrightness = 0.05f

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            layoutParams.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        window.attributes = layoutParams

        WindowCompat.setDecorFitsSystemWindows(window, false)
        hideSystemBars()
    }

    private fun hideSystemBars() {
        val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
        windowInsetsController.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        windowInsetsController.hide(WindowInsetsCompat.Type.systemBars())
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemBars()
            if (!isPositionInitialized) {
                restoreSavedClockPosition()
            }
        }
    }

    private fun initViews() {
        rootLayout = findViewById(R.id.rootAodLayout)
        clockContainer = findViewById(R.id.clockContainer)
        tvTimeHorizontal = findViewById(R.id.tvTimeHorizontal)
        layoutTimeStacked = findViewById(R.id.layoutTimeStacked)
        tvHoursStacked = findViewById(R.id.tvHoursStacked)
        tvMinutesStacked = findViewById(R.id.tvMinutesStacked)
        tvDate = findViewById(R.id.tvDate)
        tvBattery = findViewById(R.id.tvBattery)
        tvAodTip = findViewById(R.id.tvAodTip)
    }

    /**
     * Allows placing the clock at ANY space on the display by dragging.
     * Also detects long-press to switch clock styles, and double-tap to wake.
     */
    private fun setupDraggableClock() {
        clockContainer.setOnTouchListener { view, event ->
            // Pass to gesture detector for double-tap and long-press
            gestureDetector.onTouchEvent(event)

            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    touchDownX = event.rawX
                    touchDownY = event.rawY
                    initialContainerX = clockContainer.x
                    initialContainerY = clockContainer.y
                    isDraggingClock = false
                    true
                }

                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - touchDownX
                    val dy = event.rawY - touchDownY

                    // Threshold to distinguish drag from tap
                    if (!isDraggingClock && (abs(dx) > 12 || abs(dy) > 12)) {
                        isDraggingClock = true
                        showTemporaryTip(getString(R.string.tip_instructions))
                    }

                    if (isDraggingClock) {
                        // Clamp inside screen bounds
                        val newX = (initialContainerX + dx).coerceIn(
                            0f,
                            (rootLayout.width - clockContainer.width).coerceAtLeast(0).toFloat()
                        )
                        val newY = (initialContainerY + dy).coerceIn(
                            0f,
                            (rootLayout.height - clockContainer.height).coerceAtLeast(0).toFloat()
                        )

                        clockContainer.x = newX
                        clockContainer.y = newY
                        customBaseX = newX
                        customBaseY = newY
                    }
                    true
                }

                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    if (isDraggingClock) {
                        saveClockPosition(customBaseX, customBaseY)
                        isDraggingClock = false
                    }
                    true
                }

                else -> false
            }
        }

        // Tap on empty space outside clock for double-tap detection
        rootLayout.setOnTouchListener { _, event ->
            gestureDetector.onTouchEvent(event)
            true
        }
    }

    /**
     * Restores saved clock position from SharedPreferences across app sessions.
     */
    private fun restoreSavedClockPosition() {
        rootLayout.post {
            val rootWidth = rootLayout.width.toFloat()
            val rootHeight = rootLayout.height.toFloat()
            if (rootWidth <= 0 || rootHeight <= 0) return@post

            val savedXRatio = prefs.getFloat(KEY_POS_X_RATIO, -1f)
            val savedYRatio = prefs.getFloat(KEY_POS_Y_RATIO, -1f)

            if (savedXRatio >= 0f && savedYRatio >= 0f) {
                customBaseX = (savedXRatio * rootWidth).coerceIn(
                    0f,
                    (rootWidth - clockContainer.width).coerceAtLeast(0f)
                )
                customBaseY = (savedYRatio * rootHeight).coerceIn(
                    0f,
                    (rootHeight - clockContainer.height).coerceAtLeast(0f)
                )
            } else {
                // Default position: Centered on display
                customBaseX = (rootWidth - clockContainer.width) / 2f
                customBaseY = (rootHeight - clockContainer.height) / 2.3f
            }

            clockContainer.x = customBaseX
            clockContainer.y = customBaseY
            isPositionInitialized = true
            applyBurnInShift()
        }
    }

    private fun saveClockPosition(x: Float, y: Float) {
        val rootWidth = rootLayout.width.toFloat()
        val rootHeight = rootLayout.height.toFloat()
        if (rootWidth > 0 && rootHeight > 0) {
            val ratioX = x / rootWidth
            val ratioY = y / rootHeight
            prefs.edit()
                .putFloat(KEY_POS_X_RATIO, ratioX)
                .putFloat(KEY_POS_Y_RATIO, ratioY)
                .apply()
        }
    }

    /**
     * Cycles between Samsung One UI lock screen clock styles:
     * - Horizontal: HH:mm on single line
     * - Stacked: HH stacked over mm
     */
    private fun cycleClockStyle() {
        currentClockStyle = if (currentClockStyle == STYLE_HORIZONTAL) STYLE_STACKED else STYLE_HORIZONTAL
        prefs.edit().putInt(KEY_CLOCK_STYLE, currentClockStyle).apply()
        applyClockStyle(currentClockStyle)
        updateClockDisplay()

        val styleName = if (currentClockStyle == STYLE_STACKED) "One UI Stacked" else "One UI Horizontal"
        showTemporaryTip("Clock style: $styleName")
    }

    private fun applyClockStyle(style: Int) {
        if (style == STYLE_STACKED) {
            tvTimeHorizontal.visibility = View.GONE
            layoutTimeStacked.visibility = View.VISIBLE
        } else {
            tvTimeHorizontal.visibility = View.VISIBLE
            layoutTimeStacked.visibility = View.GONE
        }
    }

    /**
     * Updates clock and date text once per minute (zero wake locks).
     */
    private fun updateClockDisplay() {
        val now = Calendar.getInstance().time
        val hours = timeFormatHours.format(now)
        val minutes = timeFormatMinutes.format(now)

        tvTimeHorizontal.text = "$hours:$minutes"
        tvHoursStacked.text = hours
        tvMinutesStacked.text = minutes
        tvDate.text = dateFormat.format(now)
    }

    /**
     * Updates minimal battery percentage text.
     * Evaluated when Intent.ACTION_BATTERY_CHANGED broadcast is received.
     */
    private fun updateBatteryDisplay(intent: Intent?) {
        if (intent == null) return

        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)

        if (level >= 0 && scale > 0) {
            val percent = (level * 100 / scale.toFloat()).toInt()
            val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
            val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                             status == BatteryManager.BATTERY_STATUS_FULL

            tvBattery.text = if (isCharging) "$percent% ⚡" else "$percent%"
        }
    }

    /**
     * OLED Anti-Burn-In Protection:
     * Every 5 minutes, shifts clock container randomly by -15px to +15px along X and Y axes.
     * Operates relative to customBaseX and customBaseY.
     */
    private fun checkAndApplyBurnInShift() {
        val currentMinute = Calendar.getInstance().get(Calendar.MINUTE)
        if (currentMinute % 5 == 0 && currentMinute != lastShiftMinute) {
            lastShiftMinute = currentMinute
            applyBurnInShift()
        }
    }

    private fun applyBurnInShift() {
        burnInDeltaX = Random.nextInt(-15, 16).toFloat()
        burnInDeltaY = Random.nextInt(-15, 16).toFloat()

        clockContainer.translationX = burnInDeltaX
        clockContainer.translationY = burnInDeltaY
    }

    private fun showTemporaryTip(message: String) {
        tvAodTip.text = message
        tvAodTip.visibility = View.VISIBLE
        tipHandler.removeCallbacksAndMessages(null)
        tipHandler.postDelayed({
            tvAodTip.visibility = View.GONE
        }, 3000)
    }

    private fun dismissAod() {
        finish()
        overridePendingTransition(0, 0)
    }

    override fun onResume() {
        super.onResume()
        hideSystemBars()
        updateClockDisplay()
        registerTimeTickReceiver()
        registerBatteryReceiver()
    }

    override fun onPause() {
        super.onPause()
        unregisterTimeTickReceiver()
        unregisterBatteryReceiver()
    }

    private fun registerTimeTickReceiver() {
        if (isTimeTickRegistered) return

        val filter = IntentFilter(Intent.ACTION_TIME_TICK)
        ContextCompat.registerReceiver(
            this,
            timeTickReceiver,
            filter,
            ContextCompat.RECEIVER_EXPORTED
        )
        isTimeTickRegistered = true
    }

    private fun unregisterTimeTickReceiver() {
        if (!isTimeTickRegistered) return

        try {
            unregisterReceiver(timeTickReceiver)
            isTimeTickRegistered = false
        } catch (_: IllegalArgumentException) {
            // Already unregistered
        }
    }

    private fun registerBatteryReceiver() {
        if (isBatteryReceiverRegistered) return

        val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        // Note: Intent.ACTION_BATTERY_CHANGED is a sticky broadcast
        val stickyIntent = ContextCompat.registerReceiver(
            this,
            batteryReceiver,
            filter,
            ContextCompat.RECEIVER_EXPORTED
        )
        // Immediate first read from sticky intent:
        updateBatteryDisplay(stickyIntent)
        isBatteryReceiverRegistered = true
    }

    private fun unregisterBatteryReceiver() {
        if (!isBatteryReceiverRegistered) return

        try {
            unregisterReceiver(batteryReceiver)
            isBatteryReceiverRegistered = false
        } catch (_: IllegalArgumentException) {
            // Already unregistered
        }
    }
}
