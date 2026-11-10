package com.headless.aod

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Bundle
import android.widget.Button
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

/**
 * Settings Activity for Headless AOD.
 *
 * Configured as the android:settingsActivity in accessibility_service_config.xml.
 * Accessible directly via:
 * Settings > Accessibility > Installed apps > Headless AOD > Settings.
 * Retains 100% headless behavior with zero launcher icon on home screen!
 */
class AODSettingsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_aod_settings)

        val prefs = getSharedPreferences(AODActivity.PREFS_NAME, Context.MODE_PRIVATE)

        val rgClockStyle = findViewById<RadioGroup>(R.id.rgClockStyle)
        val rbStyleHorizontal = findViewById<RadioButton>(R.id.rbStyleHorizontal)
        val rbStyleStacked = findViewById<RadioButton>(R.id.rbStyleStacked)

        val currentStyle = prefs.getInt(AODActivity.KEY_CLOCK_STYLE, AODActivity.STYLE_HORIZONTAL)
        if (currentStyle == AODActivity.STYLE_STACKED) {
            rbStyleStacked.isChecked = true
        } else {
            rbStyleHorizontal.isChecked = true
        }

        rgClockStyle.setOnCheckedChangeListener { _, checkedId ->
            val newStyle = if (checkedId == R.id.rbStyleStacked) {
                AODActivity.STYLE_STACKED
            } else {
                AODActivity.STYLE_HORIZONTAL
            }
            prefs.edit().putInt(AODActivity.KEY_CLOCK_STYLE, newStyle).apply()
        }

        // Preset Position Buttons
        findViewById<Button>(R.id.btnPosTop).setOnClickListener {
            prefs.edit()
                .putFloat(AODActivity.KEY_POS_X_RATIO, 0.25f)
                .putFloat(AODActivity.KEY_POS_Y_RATIO, 0.12f)
                .apply()
        }

        findViewById<Button>(R.id.btnPosCenter).setOnClickListener {
            prefs.edit()
                .putFloat(AODActivity.KEY_POS_X_RATIO, 0.25f)
                .putFloat(AODActivity.KEY_POS_Y_RATIO, 0.40f)
                .apply()
        }

        findViewById<Button>(R.id.btnPosBottom).setOnClickListener {
            prefs.edit()
                .putFloat(AODActivity.KEY_POS_X_RATIO, 0.25f)
                .putFloat(AODActivity.KEY_POS_Y_RATIO, 0.70f)
                .apply()
        }

        // Read battery status once via sticky broadcast
        val batteryStatusIntent = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = batteryStatusIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryStatusIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val percent = if (level >= 0 && scale > 0) (level * 100 / scale.toFloat()).toInt() else -1
        findViewById<TextView>(R.id.tvBatteryStatusPreview).text =
            if (percent >= 0) "Current Battery Level: $percent% (Live listener active)" else "Battery: Ready"

        // Test preview button
        findViewById<Button>(R.id.btnTestAod).setOnClickListener {
            startActivity(Intent(this, AODActivity::class.java))
        }
    }
}
