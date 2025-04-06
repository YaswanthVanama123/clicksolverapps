# ----- React Native Specific Rules -----
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# ----- Firebase Specific Rules -----
-keep class com.google.firebase.analytics.FirebaseAnalytics { *; }
-keep class com.google.android.gms.measurement.** { *; }
-dontwarn com.google.firebase.**

# Remove Logging (if safe to do so)
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
    public static int w(...);
    public static int e(...);
}

# Keep any additional code for libraries you need
# For example:
# -keep class com.some.library.** { *; }
