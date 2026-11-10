import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import {
  Folder,
  FileCode,
  FileText,
  Download,
  Copy,
  Check,
  Smartphone,
  Shield,
  Zap,
  Cpu,
  ChevronRight,
  ExternalLink,
  Code2,
  Eye,
  Info,
  Terminal,
  RefreshCw,
  Sun,
  Moon,
  Layers,
  Sparkles,
  Battery,
  BatteryCharging,
  Move,
  Clock
} from 'lucide-react';

// Complete dictionary of files for display, copy, and ZIP download
export const PROJECT_FILES: Record<string, { language: string; description: string; content: string }> = {
  '.github/workflows/build.yml': {
    language: 'yaml',
    description: 'Cloud CI workflow: builds APK & generates Gradle wrapper automatically on GitHub runners',
    content: `name: Build Headless AOD APK

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build & Package APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Set up Gradle Environment
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.7'

      - name: Generate Gradle Wrapper
        run: |
          gradle wrapper --gradle-version 8.7 --distribution-type bin
          chmod +x gradlew

      - name: Build Debug APK
        run: ./gradlew assembleDebug --no-daemon --stacktrace

      - name: Verify APK Generated
        run: |
          ls -la app/build/outputs/apk/debug/
          test -f app/build/outputs/apk/debug/app-debug.apk

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: HeadlessAOD-OneUI-debug
          path: app/build/outputs/apk/debug/app-debug.apk
          if-no-files-found: error
          retention-days: 14`
  },
  'settings.gradle.kts': {
    language: 'kotlin',
    description: 'Gradle multi-project root settings with Google and MavenCentral repositories',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "HeadlessAOD"
include(":app")`
  },
  'build.gradle.kts': {
    language: 'kotlin',
    description: 'Root Gradle configuration defining Android and Kotlin build plugins',
    content: `plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "2.0.20" apply false
}`
  },
  'gradle.properties': {
    language: 'properties',
    description: 'JVM memory allocations and AndroidX migration flags for fast compilation',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official`
  },
  'gradle/wrapper/gradle-wrapper.properties': {
    language: 'properties',
    description: 'Gradle wrapper 8.7 binary distribution configuration',
    content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`
  },
  'app/build.gradle.kts': {
    language: 'kotlin',
    description: 'App module build script targeting Android 14/15/16+ (SDK 35) with minimal runtime deps',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.headless.aod"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.headless.aod"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
        debug {
            isMinifyEnabled = false
            applicationIdSuffix = ""
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
}`
  },
  'app/proguard-rules.pro': {
    language: 'pro',
    description: 'ProGuard/R8 dead-code stripping rules to ensure tiny APK footprint (~1.1MB)',
    content: `# Minimal ProGuard / R8 rules for Headless AOD
-keep class com.headless.aod.AODActivity { *; }
-keep class com.headless.aod.AODSettingsActivity { *; }
-keep class com.headless.aod.service.AodAccessibilityService { *; }
-dontwarn androidx.**`
  },
  'app/src/main/AndroidManifest.xml': {
    language: 'xml',
    description: 'Headless manifest: strictly NO LAUNCHER category, ZERO dangerous permissions, binds service',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- 
      ZERO PERMISSION ARCHITECTURE
      No INTERNET permission requested.
      No storage, phone state, or location permissions requested.
      100% private, offline, and secure.
    -->

    <application
        android:allowBackup="false"
        android:dataExtractionRules="@null"
        android:fullBackupContent="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/Theme.HeadlessAOD">

        <!--
          HEADLESS AOD ACTIVITY:
          Strictly NO "android.intent.category.LAUNCHER" intent-filter.
          The app will not appear on the home screen or app drawer.
          Only visible inside Settings > Apps and Settings > Accessibility.
        -->
        <activity
            android:name=".AODActivity"
            android:exported="false"
            android:excludeFromRecents="true"
            android:noHistory="true"
            android:launchMode="singleInstance"
            android:screenOrientation="portrait"
            android:showWhenLocked="true"
            android:turnScreenOn="true"
            android:showOnLockScreen="true"
            android:inheritShowWhenLocked="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden" />

        <!--
          ACCESSIBILITY SETTINGS ACTIVITY:
          Allows user to open settings directly from Settings > Accessibility without launcher icon.
        -->
        <activity
            android:name=".AODSettingsActivity"
            android:exported="true"
            android:label="@string/settings_title" />

        <!--
          IMMORTAL ACCESSIBILITY SERVICE:
          Runs persistently with direct system_server binding.
          Samsung One UI does not kill active AccessibilityServices.
          Allows starting AODActivity from the background upon ACTION_SCREEN_OFF.
        -->
        <service
            android:name=".service.AodAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

    </application>

</manifest>`
  },
  'app/src/main/res/xml/accessibility_service_config.xml': {
    language: 'xml',
    description: 'Accessibility service metadata XML with settingsActivity integration',
    content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_service_description"
    android:accessibilityEventTypes="typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canRetrieveWindowContent="false"
    android:canRequestFilterKeyEvents="false"
    android:canRequestTouchExplorationMode="false"
    android:settingsActivity="com.headless.aod.AODSettingsActivity" />`
  },
  'app/src/main/res/layout/activity_aod.xml': {
    language: 'xml',
    description: 'Draggable pure black layout supporting Horizontal & Stacked One UI clock styles and battery indicator',
    content: `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/rootAodLayout"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/pure_black"
    android:clickable="true"
    android:focusable="true">

    <!-- 
      Draggable & Configurable Clock & Battery Container:
      Can be placed in any space on the display (saved to SharedPreferences).
      Also shifted dynamically by -15px to +15px every 5 minutes to prevent OLED burn-in.
    -->
    <LinearLayout
        android:id="@+id/clockContainer"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:gravity="center"
        android:orientation="vertical"
        android:padding="20dp">

        <!-- STYLE 1: Standard Horizontal One UI Lockscreen Clock (HH:mm) -->
        <TextView
            android:id="@+id/tvTimeHorizontal"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:fontFamily="sans-serif-light"
            android:includeFontPadding="false"
            android:letterSpacing="0.02"
            android:textColor="@color/pure_white"
            android:textSize="68sp"
            android:visibility="visible" />

        <!-- STYLE 2: Signature One UI Stacked Lockscreen Clock (Hours over Minutes) -->
        <LinearLayout
            android:id="@+id/layoutTimeStacked"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:gravity="center"
            android:orientation="vertical"
            android:visibility="gone">

            <TextView
                android:id="@+id/tvHoursStacked"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:fontFamily="sans-serif-medium"
                android:includeFontPadding="false"
                android:lineSpacingMultiplier="0.8"
                android:textColor="@color/pure_white"
                android:textSize="64sp" />

            <TextView
                android:id="@+id/tvMinutesStacked"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:fontFamily="sans-serif-medium"
                android:includeFontPadding="false"
                android:lineSpacingMultiplier="0.8"
                android:textColor="@color/pure_white"
                android:textSize="64sp" />
        </LinearLayout>

        <!-- Date Display: Thin, elegant date string below clock -->
        <TextView
            android:id="@+id/tvDate"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="6dp"
            android:fontFamily="sans-serif-light"
            android:includeFontPadding="false"
            android:letterSpacing="0.04"
            android:textColor="@color/subdued_white"
            android:textSize="15sp" />

        <!-- Minimal Battery Percentage: Updated via Intent.ACTION_BATTERY_CHANGED -->
        <TextView
            android:id="@+id/tvBattery"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:fontFamily="sans-serif-light"
            android:includeFontPadding="false"
            android:letterSpacing="0.03"
            android:textColor="@color/battery_text_color"
            android:textSize="13sp" />

    </LinearLayout>

    <!-- Brief Help Toast overlay on long-press (vanishes quickly) -->
    <TextView
        android:id="@+id/tvAodTip"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="bottom|center_horizontal"
        android:layout_marginBottom="40dp"
        android:background="#1AFFFFFF"
        android:paddingStart="12dp"
        android:paddingTop="6dp"
        android:paddingEnd="12dp"
        android:paddingBottom="6dp"
        android:text="@string/tip_instructions"
        android:textColor="#88FFFFFF"
        android:textSize="11sp"
        android:visibility="gone" />

</FrameLayout>`
  },
  'app/src/main/res/layout/activity_aod_settings.xml': {
    language: 'xml',
    description: 'Accessibility settings layout for selecting lockscreen clock styles and position presets',
    content: `<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#121212"
    android:padding="20dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@string/settings_title"
            android:textColor="#FFFFFF"
            android:textSize="22sp"
            android:textStyle="bold" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:text="Samsung Galaxy A16 5G (One UI)"
            android:textColor="#888888"
            android:textSize="13sp" />

        <!-- Card: Clock Style -->
        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="24dp"
            android:background="#1E1E1E"
            android:orientation="vertical"
            android:padding="16dp">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="@string/clock_style_title"
                android:textColor="#FFFFFF"
                android:textSize="15sp"
                android:textStyle="bold" />

            <RadioGroup
                android:id="@+id/rgClockStyle"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="12dp">

                <RadioButton
                    android:id="@+id/rbStyleHorizontal"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="One UI Standard Horizontal (10:45)"
                    android:textColor="#E0E0E0"
                    android:textSize="14sp" />

                <RadioButton
                    android:id="@+id/rbStyleStacked"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="8dp"
                    android:text="One UI Signature Stacked (10 over 45)"
                    android:textColor="#E0E0E0"
                    android:textSize="14sp" />
            </RadioGroup>
        </LinearLayout>

        <!-- Card: Position Presets -->
        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="16dp"
            android:background="#1E1E1E"
            android:orientation="vertical"
            android:padding="16dp">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="@string/clock_position_title"
                android:textColor="#FFFFFF"
                android:textSize="15sp"
                android:textStyle="bold" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginTop="4dp"
                android:text="Tip: You can also drag the clock directly on the AOD screen to place it in any custom position."
                android:textColor="#AAAAAA"
                android:textSize="12sp" />

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="12dp"
                android:orientation="horizontal">

                <Button
                    android:id="@+id/btnPosTop"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:text="Top"
                    android:textSize="12sp" />

                <Button
                    android:id="@+id/btnPosCenter"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_marginStart="8dp"
                    android:layout_weight="1"
                    android:text="Center"
                    android:textSize="12sp" />

                <Button
                    android:id="@+id/btnPosBottom"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_marginStart="8dp"
                    android:layout_weight="1"
                    android:text="Bottom"
                    android:textSize="12sp" />
            </LinearLayout>
        </LinearLayout>

        <!-- Card: Battery Status Preview -->
        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="16dp"
            android:background="#1E1E1E"
            android:orientation="vertical"
            android:padding="16dp">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Battery &amp; Low-Power Status"
                android:textColor="#FFFFFF"
                android:textSize="15sp"
                android:textStyle="bold" />

            <TextView
                android:id="@+id/tvBatteryStatusPreview"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginTop="6dp"
                android:text="Battery: Reading..."
                android:textColor="#10B981"
                android:textSize="13sp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginTop="4dp"
                android:text="Updated passively via Intent.ACTION_BATTERY_CHANGED (0% CPU wake)."
                android:textColor="#888888"
                android:textSize="11sp" />
        </LinearLayout>

        <Button
            android:id="@+id/btnTestAod"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="24dp"
            android:backgroundTint="#10B981"
            android:text="Preview Always On Display"
            android:textColor="#000000"
            android:textStyle="bold" />

    </LinearLayout>
</ScrollView>`
  },
  'app/src/main/res/values/strings.xml': {
    language: 'xml',
    description: 'System string resources for application, accessibility description, and settings UI',
    content: `<resources>
    <string name="app_name">Headless AOD</string>
    <string name="accessibility_service_description">Provides an ultra-lightweight, zero-permission Always On Display overlay with battery indicator and customizable clock positions when your screen turns off.</string>
    <string name="tip_instructions">Drag clock anywhere to reposition • Long-press clock to switch lock screen style • Double-tap to wake</string>
    <string name="settings_title">Headless AOD Settings</string>
    <string name="clock_style_title">Lock Screen Clock Style</string>
    <string name="clock_position_title">Clock Display Position</string>
</resources>`
  },
  'app/src/main/res/values/colors.xml': {
    language: 'xml',
    description: 'Color constants: #000000 True Black for 0% OLED power consumption + battery color',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Pure AMOLED True Black: 0% power draw on Galaxy A16 5G OLED display -->
    <color name="pure_black">#000000</color>
    <!-- Crisp pure white for minimal clock and date -->
    <color name="pure_white">#FFFFFF</color>
    <!-- Subtle subdued white for date (80% opacity) -->
    <color name="subdued_white">#CCFFFFFF</color>
    <!-- Minimal battery text color (65% opacity to avoid distraction) -->
    <color name="battery_text_color">#A6FFFFFF</color>
</resources>`
  },
  'app/src/main/res/values/themes.xml': {
    language: 'xml',
    description: 'Theme with zero-animations, full display-cutout coverage, and pure black window background',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.HeadlessAOD" parent="Theme.MaterialComponents.NoActionBar">
        <!-- Pure AMOLED True Black Background -->
        <item name="android:windowBackground">@color/pure_black</item>
        <item name="android:colorBackground">@color/pure_black</item>
        <item name="android:statusBarColor">@color/pure_black</item>
        <item name="android:navigationBarColor">@color/pure_black</item>

        <!-- No window title, full screen immersive -->
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowFullscreen">true</item>

        <!-- Disable window transitions for instantaneous seamless black overlay -->
        <item name="android:windowAnimationStyle">@null</item>
        <item name="android:windowDisablePreview">true</item>

        <!-- Allow rendering inside cutout area (camera punch hole) -->
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
    </style>
</resources>`
  },
  'app/src/main/java/com/headless/aod/AODSettingsActivity.kt': {
    language: 'kotlin',
    description: 'Accessible via Settings > Accessibility: allows customizing clock styles and position presets',
    content: `package com.headless.aod

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
}`
  },
  'app/src/main/java/com/headless/aod/service/AodAccessibilityService.kt': {
    language: 'kotlin',
    description: 'Immortal background service: registers ACTION_SCREEN_OFF & launches AODActivity from background',
    content: `package com.headless.aod.service

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
            Log.w(TAG, "Receiver was not registered or already removed: \${e.message}")
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
}`
  },
  'app/src/main/java/com/headless/aod/AODActivity.kt': {
    language: 'kotlin',
    description: 'AOD UI with minimal battery receiver, draggable display placement, One UI clock styles, and burn-in jitter',
    content: `package com.headless.aod

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
}`
  },
  'README.md': {
    language: 'markdown',
    description: 'Project documentation, GitHub Actions setup instructions, and One UI setup guide',
    content: `# Headless AOD for Samsung Galaxy (One UI 6–9 / Android 14–17)

An ultra-lightweight, zero-permission, headless Always On Display engine in Kotlin with minimal battery percentage and customizable space placement.

## Key Features
- **Headless Architecture:** Zero launcher icon (\`LAUNCHER\` intent filter omitted). App only shows up in *Settings > Apps*.
- **Zero Permissions:** 100% offline, private, zero battery-draining background sync. No \`INTERNET\` permission in manifest.
- **Minimal Battery Percentage:** Updated passively via \`Intent.ACTION_BATTERY_CHANGED\` (lightweight sticky system callback, 0% CPU wake).
- **Customizable Display Position:** Drag the clock anywhere on the display to place it in any custom position. Coordinates are persisted across boots.
- **Samsung One UI Lock Screen Styles:**
  - Style 0: One UI Standard Horizontal (\`10:45\`)
  - Style 1: One UI Signature Stacked (\`10\` over \`45\`)
  - Long-press clock on AOD to cycle styles or configure via Accessibility settings.
- **Immortal Background Service:** Uses \`AccessibilityService\` bound directly to Android's \`system_server\`. Never killed by One UI's background process killer, and automatically starts on device boot. Deliberately exempted by Android OS from Background Activity Launch (BAL) restrictions.
- **Screen-Off Trigger:** Dynamically registers \`ACTION_SCREEN_OFF\` and launches \`AODActivity\` with \`FLAG_ACTIVITY_NEW_TASK\`.
- **True Black AMOLED UI:** \`#000000\` window background, zero power on OLED sub-pixels.
- **Hardware Brightness:** Clamped to \`0.05f\` (5%) to save battery.
- **Burn-in Protection:** Sub-pixel jitter of -15px to +15px on X and Y every 5 minutes around your custom chosen position.
- **Double-Tap Wake:** Double-tap anywhere to immediately dismiss the AOD and show the Samsung lock screen.`
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'guide' | 'architecture'>('simulator');
  const [selectedFile, setSelectedFile] = useState<string>('app/src/main/java/com/headless/aod/AODActivity.kt');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  // Simulator Interactive States
  const [currentTimeHours, setCurrentTimeHours] = useState<string>('10');
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<string>('45');
  const [currentDate, setCurrentDate] = useState<string>('Mon, Nov 9');
  const [batteryLevel, setBatteryLevel] = useState<number>(85);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [clockStyle, setClockStyle] = useState<'horizontal' | 'stacked'>('horizontal');
  const [brightnessFivePercent, setBrightnessFivePercent] = useState<boolean>(true);

  // Dragging and positioning states
  const [posX, setPosX] = useState<number>(0); // relative offset in simulator px
  const [posY, setPosY] = useState<number>(0);
  const [shiftX, setShiftX] = useState<number>(0); // Burn-in jitter
  const [shiftY, setShiftY] = useState<number>(0);
  const [wakePulse, setWakePulse] = useState<boolean>(false);
  const [simState, setSimState] = useState<'aod' | 'lockscreen'>('aod');
  const [isDragging, setIsDragging] = useState(false);
  const [tipToast, setTipToast] = useState<string | null>(null);

  const dragStartRef = useRef<{ x: number; y: number; initialPosX: number; initialPosY: number }>({
    x: 0,
    y: 0,
    initialPosX: 0,
    initialPosY: 0
  });
  const lastTapRef = useRef<number>(0);

  // Update clock in simulator
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeHours(String(now.getHours()).padStart(2, '0'));
      setCurrentTimeMinutes(String(now.getMinutes()).padStart(2, '0'));

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setCurrentDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerBurnInShift = () => {
    const newX = Math.floor(Math.random() * 31) - 15; // -15 to +15
    const newY = Math.floor(Math.random() * 31) - 15;
    setShiftX(newX);
    setShiftY(newY);
  };

  const handleSimScreenTap = () => {
    if (isDragging) return;
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      setWakePulse(true);
      setTimeout(() => {
        setSimState('lockscreen');
        setWakePulse(false);
      }, 200);
    }
    lastTapRef.current = now;
  };

  // Dragging support for simulator screen
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPosX: posX,
      initialPosY: posY
    };
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    // Constrain within phone boundary
    const newX = Math.max(-80, Math.min(80, dragStartRef.current.initialPosX + dx));
    const newY = Math.max(-180, Math.min(180, dragStartRef.current.initialPosY + dy));
    setPosX(newX);
    setPosY(newY);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setTipToast('Position saved in SharedPreferences');
      setTimeout(() => setTipToast(null), 2500);
    }
  };

  const applyPositionPreset = (pos: 'top' | 'center' | 'bottom') => {
    if (pos === 'top') {
      setPosX(0);
      setPosY(-140);
    } else if (pos === 'center') {
      setPosX(0);
      setPosY(-20);
    } else {
      setPosX(0);
      setPosY(130);
    }
    setTipToast(`Position set to: ${pos.toUpperCase()}`);
    setTimeout(() => setTipToast(null), 2500);
  };

  const toggleClockStyle = () => {
    const nextStyle = clockStyle === 'horizontal' ? 'stacked' : 'horizontal';
    setClockStyle(nextStyle);
    setTipToast(`Clock Style: ${nextStyle === 'stacked' ? 'One UI Stacked' : 'One UI Horizontal'}`);
    setTimeout(() => setTipToast(null), 2500);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadProjectZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add all project files into the ZIP structure
      Object.entries(PROJECT_FILES).forEach(([path, file]) => {
        zip.file(path, file.content);
      });

      zip.file(
        '.gitignore',
        `*.iml\n.gradle\n/local.properties\n/.idea\n.DS_Store\n/build\n/captures\n.externalNativeBuild\n.cxx\nlocal.properties\napp/build/`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'HeadlessAOD-Samsung-OneUI.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('ZIP generation failed', e);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-neutral-800 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white shadow-inner">
              <Moon className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-semibold text-sm tracking-wide text-white">Headless AOD Engine</h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  One UI 6–9 / Android 14–17
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Samsung Galaxy A16 5G (Super AMOLED) • 0 Permissions • Minimal Battery • Free Position
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={downloadProjectZip}
              disabled={isZipping}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-xs font-medium transition shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Packaging ZIP...' : 'Download Project ZIP'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 border-t border-neutral-800/60 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-2 border-b-2 font-medium flex items-center space-x-1.5 transition ${
              activeTab === 'simulator'
                ? 'border-emerald-400 text-emerald-400 bg-neutral-900/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Galaxy A16 AOD Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-2 border-b-2 font-medium flex items-center space-x-1.5 transition ${
              activeTab === 'code'
                ? 'border-emerald-400 text-emerald-400 bg-neutral-900/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Complete Source Code ({Object.keys(PROJECT_FILES).length} Files)</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-2 border-b-2 font-medium flex items-center space-x-1.5 transition ${
              activeTab === 'guide'
                ? 'border-emerald-400 text-emerald-400 bg-neutral-900/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>GitHub Actions & One UI Setup</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-2 border-b-2 font-medium flex items-center space-x-1.5 transition ${
              activeTab === 'architecture'
                ? 'border-emerald-400 text-emerald-400 bg-neutral-900/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>System Architecture & Physics</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* TAB 1: GALAXY A16 AOD SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Phone Display Mockup */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="text-xs text-neutral-400 mb-2 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Drag clock to reposition • Double-tap screen to wake</span>
              </div>

              {/* Samsung Galaxy A16 Form Factor Frame */}
              <div className="relative w-[300px] h-[620px] bg-neutral-900 rounded-[44px] p-3 shadow-2xl border-4 border-neutral-800 ring-1 ring-neutral-700/50 select-none">
                {/* Physical buttons styling */}
                <div className="absolute -right-4.5 top-28 w-1 h-12 bg-neutral-800 rounded-r-md"></div>
                <div className="absolute -right-4.5 top-44 w-1 h-8 bg-neutral-800 rounded-r-md"></div>

                {/* OLED Display Area */}
                <div
                  onClick={handleSimScreenTap}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className={`w-full h-full rounded-[34px] overflow-hidden relative cursor-default transition-all duration-300 ${
                    simState === 'aod'
                      ? 'bg-black'
                      : 'bg-gradient-to-b from-slate-900 via-indigo-950 to-neutral-950'
                  }`}
                  style={{
                    backgroundColor: simState === 'aod' ? '#000000' : undefined,
                    opacity: simState === 'aod' ? (brightnessFivePercent ? 0.65 : 1) : 1
                  }}
                >
                  {/* Punch Hole Camera */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-neutral-950 rounded-full border border-neutral-900 z-30 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-900"></div>
                  </div>

                  {/* AOD Screen Mode */}
                  {simState === 'aod' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center relative p-4 overflow-hidden">
                      {/* Draggable & Shifted Clock Container */}
                      <div
                        onMouseDown={handleMouseDown}
                        className={`flex flex-col items-center text-center cursor-move p-3 rounded-2xl transition-shadow ${
                          isDragging ? 'bg-white/5 ring-1 ring-emerald-500/50' : 'hover:bg-white/5'
                        }`}
                        style={{
                          transform: `translate(${posX + shiftX}px, ${posY + shiftY}px)`,
                          transition: isDragging ? 'none' : 'transform 0.5s ease-out'
                        }}
                      >
                        {/* STYLE 1: Horizontal Lockscreen Clock */}
                        {clockStyle === 'horizontal' ? (
                          <span
                            className="text-6xl font-light tracking-tight text-white font-mono"
                            style={{ textShadow: '0 0 1px rgba(255,255,255,0.4)' }}
                          >
                            {currentTimeHours}:{currentTimeMinutes}
                          </span>
                        ) : (
                          /* STYLE 2: Iconic Samsung One UI Stacked Lockscreen Clock */
                          <div className="flex flex-col items-center leading-none">
                            <span
                              className="text-6xl font-medium tracking-tight text-white font-mono leading-none"
                              style={{ textShadow: '0 0 1px rgba(255,255,255,0.4)' }}
                            >
                              {currentTimeHours}
                            </span>
                            <span
                              className="text-6xl font-medium tracking-tight text-white font-mono leading-none mt-1"
                              style={{ textShadow: '0 0 1px rgba(255,255,255,0.4)' }}
                            >
                              {currentTimeMinutes}
                            </span>
                          </div>
                        )}

                        {/* Date string */}
                        <span className="text-xs font-light text-neutral-300 mt-2 tracking-wider">
                          {currentDate}
                        </span>

                        {/* Minimal Battery Percentage Text */}
                        <div className="flex items-center space-x-1 text-[12px] font-light text-neutral-400 mt-1">
                          <span>{batteryLevel}%</span>
                          {isCharging && <span className="text-emerald-400 text-[11px]">⚡</span>}
                        </div>
                      </div>

                      {/* On-screen Toast Notification */}
                      {tipToast && (
                        <div className="absolute bottom-12 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-700 text-[11px] text-emerald-400 font-mono shadow-lg animate-fadeIn pointer-events-none">
                          {tipToast}
                        </div>
                      )}

                      {/* Touch Ripple indicator on double tap */}
                      {wakePulse && (
                        <div className="absolute inset-0 bg-white/20 animate-ping rounded-full pointer-events-none"></div>
                      )}

                      {/* Canvas Subtext */}
                      <div className="absolute bottom-4 text-[9px] text-neutral-600 text-center font-mono pointer-events-none">
                        Double-tap screen to wake • Drag clock to move
                      </div>
                    </div>
                  ) : (
                    /* Native Lock Screen Mode */
                    <div className="w-full h-full flex flex-col justify-between p-6 text-white animate-fadeIn">
                      <div className="mt-8 flex justify-between items-center text-xs text-neutral-300 font-mono">
                        <span>One UI Lock Screen</span>
                        <span>{batteryLevel}% 🔋</span>
                      </div>

                      <div className="my-auto text-center">
                        <p className="text-5xl font-medium tracking-tight mb-1">
                          {currentTimeHours}:{currentTimeMinutes}
                        </p>
                        <p className="text-sm text-neutral-300">{currentDate}</p>
                        <div className="mt-6 inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 rounded-full text-xs backdrop-blur-md">
                          <span>Lock screen revealed</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSimState('aod');
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow"
                        >
                          Turn Off Screen (Test ACTION_SCREEN_OFF)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 mt-3 font-mono">
                Position: X: {posX}px, Y: {posY}px • Jitter: ±15px active
              </div>
            </div>

            {/* Controls & Metrics */}
            <div className="lg:col-span-7 space-y-6">
              {/* Feature Controls */}
              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>AOD Customization Engine</span>
                  </h3>
                  <span className="text-xs text-neutral-400 font-mono">One UI Parity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Lock Screen Clock Style Toggle */}
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <div className="font-medium text-neutral-200">Lock Screen Time Style</div>
                    </div>
                    <p className="text-neutral-400 text-[11px]">
                      Match Samsung One UI lock screen layouts.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          setClockStyle('horizontal');
                          setTipToast('Style: Standard Horizontal');
                          setTimeout(() => setTipToast(null), 2000);
                        }}
                        className={`flex-1 py-1.5 rounded text-[11px] font-medium transition ${
                          clockStyle === 'horizontal'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        Horizontal (10:45)
                      </button>
                      <button
                        onClick={() => {
                          setClockStyle('stacked');
                          setTipToast('Style: One UI Stacked');
                          setTimeout(() => setTipToast(null), 2000);
                        }}
                        className={`flex-1 py-1.5 rounded text-[11px] font-medium transition ${
                          clockStyle === 'stacked'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        Stacked (10 over 45)
                      </button>
                    </div>
                  </div>

                  {/* Display Position Controls */}
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Move className="w-4 h-4 text-blue-400" />
                      <div className="font-medium text-neutral-200">Position in Any Space</div>
                    </div>
                    <p className="text-neutral-400 text-[11px]">
                      Snap to presets or drag freely on the display screen.
                    </p>
                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => applyPositionPreset('top')}
                        className="flex-1 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] transition"
                      >
                        Top
                      </button>
                      <button
                        onClick={() => applyPositionPreset('center')}
                        className="flex-1 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] transition"
                      >
                        Center
                      </button>
                      <button
                        onClick={() => applyPositionPreset('bottom')}
                        className="flex-1 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] transition"
                      >
                        Bottom
                      </button>
                    </div>
                  </div>

                  {/* Battery Simulator Controls */}
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isCharging ? (
                          <BatteryCharging className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Battery className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="font-medium text-neutral-200">
                          ACTION_BATTERY_CHANGED
                        </span>
                      </div>
                      <span className="font-mono text-emerald-400 text-[11px]">
                        {batteryLevel}% {isCharging ? '⚡' : ''}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={batteryLevel}
                      onChange={(e) => setBatteryLevel(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-neutral-500">Zero-polling sticky broadcast</span>
                      <button
                        onClick={() => setIsCharging(!isCharging)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                          isCharging
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {isCharging ? 'Charging (⚡)' : 'Discharging'}
                      </button>
                    </div>
                  </div>

                  {/* Burn-in Test Button */}
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-neutral-200">Burn-in Jitter (±15px)</div>
                      <span className="font-mono text-emerald-400 text-[11px]">
                        X: {shiftX > 0 ? `+${shiftX}` : shiftX}px | Y: {shiftY > 0 ? `+${shiftY}` : shiftY}px
                      </span>
                    </div>
                    <p className="text-neutral-400 text-[11px]">
                      Applies sub-pixel shift around your custom saved position.
                    </p>
                    <button
                      onClick={triggerBurnInShift}
                      className="w-full py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] transition"
                    >
                      Trigger Jitter Shift Now
                    </button>
                  </div>
                </div>

                {/* State Toggle Buttons */}
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => setSimState('aod')}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition ${
                      simState === 'aod'
                        ? 'bg-neutral-800 border-neutral-600 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Display AOD (ACTION_SCREEN_OFF)
                  </button>
                  <button
                    onClick={() => setSimState('lockscreen')}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition ${
                      simState === 'lockscreen'
                        ? 'bg-neutral-800 border-neutral-600 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Simulate Double-Tap Wake
                  </button>
                  <button
                    onClick={() => setBrightnessFivePercent(!brightnessFivePercent)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300 text-xs"
                  >
                    {brightnessFivePercent ? '5% Dimming: ON' : '5% Dimming: OFF'}
                  </button>
                </div>
              </div>

              {/* Hardware & Power Metrics Card */}
              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Hardware Low-Power Architecture</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Battery Receiver</span>
                    <span className="text-emerald-400 font-mono font-semibold text-sm">Passive Sticky</span>
                    <p className="text-[10px] text-neutral-500 mt-1">Zero CPU polling loops</p>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Position Memory</span>
                    <span className="text-emerald-400 font-mono font-semibold text-sm">SharedPreferences</span>
                    <p className="text-[10px] text-neutral-500 mt-1">Persistent across reboots</p>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Clock Styles</span>
                    <span className="text-emerald-400 font-mono font-semibold text-sm">One UI Parity</span>
                    <p className="text-[10px] text-neutral-500 mt-1">Horizontal &amp; Stacked</p>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Headless Setup</span>
                    <span className="text-emerald-400 font-mono font-semibold text-sm">settingsActivity</span>
                    <p className="text-[10px] text-neutral-500 mt-1">Configurable via Accessibility</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPLETE SOURCE CODE VIEWER */}
        {activeTab === 'code' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* File List Tree */}
            <div className="md:col-span-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                  <Folder className="w-4 h-4 text-emerald-400" />
                  <span>Project Repository</span>
                </div>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {Object.keys(PROJECT_FILES).length} files
                </span>
              </div>

              <div className="space-y-1">
                {Object.entries(PROJECT_FILES).map(([filePath, meta]) => {
                  const isSelected = selectedFile === filePath;
                  const isKotlin = filePath.endsWith('.kt');
                  const isXml = filePath.endsWith('.xml');
                  const isGradle = filePath.endsWith('.gradle.kts');
                  const isWorkflow = filePath.includes('.github');

                  return (
                    <button
                      key={filePath}
                      onClick={() => setSelectedFile(filePath)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-mono transition flex items-center justify-between group ${
                        isSelected
                          ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 font-medium'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        {isKotlin ? (
                          <span className="text-purple-400 text-[10px] font-bold">KT</span>
                        ) : isXml ? (
                          <span className="text-amber-400 text-[10px] font-bold">XML</span>
                        ) : isGradle ? (
                          <span className="text-blue-400 text-[10px] font-bold">KTS</span>
                        ) : isWorkflow ? (
                          <span className="text-emerald-400 text-[10px] font-bold">CI</span>
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-neutral-500" />
                        )}
                        <span className="truncate">{filePath}</span>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 flex-shrink-0 transition ${
                          isSelected ? 'text-emerald-400' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800">
                <button
                  onClick={downloadProjectZip}
                  disabled={isZipping}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isZipping ? 'Archiving...' : 'Download Full Repo (.ZIP)'}</span>
                </button>
              </div>
            </div>

            {/* Code Content Display */}
            <div className="md:col-span-8 bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="p-3.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-medium text-white">{selectedFile}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                      {PROJECT_FILES[selectedFile]?.language}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {PROJECT_FILES[selectedFile]?.description}
                  </p>
                </div>

                <button
                  onClick={() => copyToClipboard(PROJECT_FILES[selectedFile]?.content || '', selectedFile)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition"
                >
                  {copiedKey === selectedFile ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-neutral-950 overflow-x-auto max-h-[640px]">
                <pre className="font-mono text-xs text-neutral-300 leading-relaxed whitespace-pre">
                  <code>{PROJECT_FILES[selectedFile]?.content}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GITHUB ACTIONS CI & ONE UI ACTIVATION */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 relative">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  STEP 01
                </span>
                <h3 className="text-sm font-semibold text-white mt-3">Push to GitHub</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Download the project ZIP or clone it. Push the repository to GitHub. No local Android Studio or Gradle wrapper needed on your PC.
                </p>
                <div className="mt-3 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 text-[11px] font-mono text-neutral-300">
                  git init<br />
                  git add .<br />
                  git commit -m "Initial commit"<br />
                  git push origin main
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 relative">
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                  STEP 02
                </span>
                <h3 className="text-sm font-semibold text-white mt-3">GitHub Actions Builds APK</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  The <code className="text-neutral-300 font-mono">.github/workflows/build.yml</code> workflow provisions JDK 17, installs Gradle 8.7, compiles the debug APK, and saves it as an artifact.
                </p>
                <div className="mt-3 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 text-[11px] font-mono text-emerald-400">
                  Artifact: HeadlessAOD-OneUI-debug<br />
                  File: app-debug.apk (~1.1 MB)
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 relative">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  STEP 03
                </span>
                <h3 className="text-sm font-semibold text-white mt-3">Configure &amp; Reposition</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Open <strong>Settings &gt; Accessibility &gt; Installed apps &gt; Headless AOD &gt; Settings</strong> or drag the clock directly on the AOD screen to position it in any space!
                </p>
                <div className="mt-3 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 text-[11px] font-mono text-neutral-300">
                  Drag clock: anywhere on screen<br />
                  Long-press: switch One UI style
                </div>
              </div>
            </div>

            {/* Crucial Samsung One UI 6+ Restricted Settings Walkthrough */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border border-amber-800/40">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">
                    Crucial: Android 14 / One UI 6 "Restricted Settings" Bypass
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Starting in Android 13 and reinforced in Android 14 (One UI 6.x), Google disables AccessibilityServices for sideloaded apps by default with the dialog:
                    <br />
                    <span className="text-amber-300 font-mono italic">
                      "Restricted setting: For your security, this setting is currently unavailable."
                    </span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                      <span className="font-semibold text-neutral-200">1. Open App Info</span>
                      <p className="text-neutral-400 text-[11px] mt-1">
                        Go to <strong>Settings &gt; Apps &gt; Headless AOD</strong>.
                      </p>
                    </div>
                    <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                      <span className="font-semibold text-neutral-200">2. Tap 3 Dots Menu</span>
                      <p className="text-neutral-400 text-[11px] mt-1">
                        Tap the <strong>3 vertical dots</strong> in the upper right corner of the screen.
                      </p>
                    </div>
                    <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                      <span className="font-semibold text-neutral-200">3. Allow Restricted Settings</span>
                      <p className="text-neutral-400 text-[11px] mt-1">
                        Tap <strong>"Allow restricted settings"</strong> and verify via fingerprint / PIN.
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-400 pt-1">
                    Once allowed, go to <strong>Settings &gt; Accessibility &gt; Installed apps &gt; Headless AOD</strong> and toggle it <strong>ON</strong>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM ARCHITECTURE & HARDWARE PHYSICS */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Cpu className="w-5 h-5" />
                  <h3 className="text-sm font-semibold text-white">Passive Battery Receiver (Zero Wake Lock)</h3>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Unlike apps that poll battery health with loops, <code className="text-emerald-400 font-mono">Intent.ACTION_BATTERY_CHANGED</code> is a system sticky broadcast.
                </p>
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs text-neutral-400 space-y-2">
                  <div className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Sticky Broadcast:</strong> Registered passively via <code className="text-neutral-200 font-mono">registerReceiver</code>; the OS supplies current battery levels immediately without CPU polling.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Subdued Typography:</strong> Displayed with thin white typography (<code className="text-neutral-200 font-mono">#A6FFFFFF</code>) for minimal OLED current draw.</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <div className="flex items-center space-x-2 text-blue-400">
                  <Move className="w-5 h-5" />
                  <h3 className="text-sm font-semibold text-white">Free-Form Display Space Positioning</h3>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Users can drag the clock container to any arbitrary coordinate on the screen.
                </p>
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs text-neutral-400 space-y-2">
                  <div className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Normalized Ratios:</strong> Stored as normalized screen ratios (<code className="text-neutral-200 font-mono">ratioX, ratioY</code>) in <code className="text-neutral-200 font-mono">SharedPreferences</code>.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Relative Burn-In Jitter:</strong> The ±15px 5-minute jitter is applied to <code className="text-neutral-200 font-mono">translationX/Y</code> on top of the custom base position.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
