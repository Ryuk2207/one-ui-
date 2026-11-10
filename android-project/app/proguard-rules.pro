# Minimal ProGuard / R8 rules for Headless AOD
-keep class com.headless.aod.AODActivity { *; }
-keep class com.headless.aod.service.AodAccessibilityService { *; }
-dontwarn androidx.**
