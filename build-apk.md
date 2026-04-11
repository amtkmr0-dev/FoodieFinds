# Generate APK for FoodieFinds User App

## Prerequisites Setup

### 1. Install Android Studio
Download and install Android Studio from: https://developer.android.com/studio

### 2. Install Java Development Kit (JDK)
```bash
# Install JDK 17 (recommended for Android development)
brew install openjdk@17

# Add to your shell profile (~/.zshrc or ~/.bash_profile)
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
```

### 3. Set up Android SDK paths
Add these to your shell profile (~/.zshrc or ~/.bash_profile):
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/build-tools/34.0.0
```

## Build Steps

### 1. Build the web app for production
```bash
npm run build
```

### 2. Sync with Android platform
```bash
npx cap sync android
```

### 3. Open in Android Studio (Recommended)
```bash
npx cap open android
```
Then in Android Studio:
- Build → Generate Signed Bundle/APK
- Choose APK
- Follow the signing process
- Build Release APK

### 4. Command Line Build (Alternative)
```bash
cd android
./gradlew assembleRelease
```

## APK Location
After successful build, find your APK at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Key Features Included in User App
- ✅ Creator browsing and filtering
- ✅ Video calling interface with live balance
- ✅ Gift sending during calls
- ✅ Wallet recharge system
- ✅ Random match functionality
- ✅ Call warnings when balance is low
- ✅ Real-time balance updates
- ✅ Account management

## Testing
Before releasing:
1. Test on physical Android device
2. Verify all calling features work
3. Test payment/recharge flow
4. Ensure gift system functions properly
5. Validate balance calculations

## Distribution
- For testing: Share APK directly
- For Play Store: Create signed bundle (AAB format)
- For enterprise: Use internal distribution

## Troubleshooting
If build fails:
1. Check JDK version: `java -version`
2. Verify Android SDK: `android --version`
3. Clean and rebuild: `cd android && ./gradlew clean`
4. Update Android Studio and SDK tools