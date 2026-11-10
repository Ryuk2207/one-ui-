# Headless AOD for Samsung Galaxy (One UI 6–9 / Android 14–17)

An ultra-lightweight, zero-permission, headless Always On Display engine in Kotlin.

## Key Technical Specifications
- **Headless Architecture:** Zero launcher icon (`LAUNCHER` intent filter omitted). App only shows up in *Settings > Apps*.
- **Zero Permissions:** 100% offline, private, zero battery-draining background sync. No `INTERNET` permission in manifest.
- **Immortal Background Service:** Uses `AccessibilityService` bound directly to Android's `system_server`. Never killed by One UI's background process killer, and automatically starts on device boot. Deliberately exempted by Android OS from Background Activity Launch (BAL) restrictions.
- **Screen-Off Trigger:** Dynamically registers `ACTION_SCREEN_OFF` and launches `AODActivity` with `FLAG_ACTIVITY_NEW_TASK`.
- **True Black AMOLED UI:** `#000000` window background, zero power on OLED sub-pixels.
- **Hardware Brightness:** Clamped to `0.05f` (5%) to save battery.
- **Burn-in Protection:** Sub-pixel jitter of -15px to +15px on X and Y every 5 minutes.
- **Zero Polling Loops:** Clock updates strictly on Android OS broadcast `Intent.ACTION_TIME_TICK` (once per minute).
- **Double-Tap Wake:** Double-tap anywhere to immediately dismiss the AOD and show the Samsung lock screen.

## How to Build in GitHub Actions
1. Create a new GitHub repository (e.g. `headless-aod`).
2. Push this directory to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Headless AOD"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/headless-aod.git
   git push -u origin main
   ```
3. GitHub Actions will automatically start the `Build & Package APK` job under the **Actions** tab.
4. When finished (typically ~1-2 minutes), download `HeadlessAOD-OneUI6-debug.zip` from the workflow summary, unzip it, and install `app-debug.apk` onto your phone.

## How to Activate on Samsung Galaxy (One UI 6, 7, 8, 9)
1. Install `app-debug.apk`.
2. Go to **Settings > Apps > Headless AOD**.
   - If prompted with *"Restricted setting: For your security, this setting is currently unavailable"*, tap the **3 dots** (top right) and choose **"Allow restricted settings"**, then authenticate.
   - Under **Battery**, choose **Unrestricted**.
3. Go to **Settings > Accessibility > Installed apps** (or *Installed services*).
4. Tap **Headless AOD** and toggle it **ON** (Allow permissions).
5. Turn off your screen! Headless AOD will activate instantly.
6. Double tap the screen to wake.
