#!/bin/bash

# FoodieFinds User App - APK Builder Script

echo "🍕 FoodieFinds User App - APK Builder"
echo "=================================="

# Check prerequisites
check_requirements() {
    echo "🔍 Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install Node.js"
        exit 1
    fi
    
    # Check Java
    if ! command -v java &> /dev/null; then
        echo "❌ Java not found. Please install JDK 17"
        exit 1
    fi
    
    # Check Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        echo "❌ ANDROID_HOME not set. Please install Android Studio and set up SDK"
        exit 1
    fi
    
    echo "✅ Requirements check passed"
}

# Build web app
build_web_app() {
    echo "📦 Building mobile web application..."
    echo "📁 Changing to user-app directory..."
    cd apps/user-app || { echo "❌ Failed to change to apps/user-app directory"; exit 1; }
    
    # Check API_BASE_URL configuration
    echo "🔧 Checking API configuration..."
    if [ -z "$NEXT_PUBLIC_API_URL" ]; then
        echo "⚠️  WARNING: NEXT_PUBLIC_API_URL environment variable not set"
        echo "⚠️  Using default API_BASE_URL: http://13.234.19.105:5000"
        echo "⚠️  To change this, set NEXT_PUBLIC_API_URL before running this script"
        echo "⚠️  Example: export NEXT_PUBLIC_API_URL=http://your-server:5000"
    else
        echo "✅ Using API_BASE_URL from environment: $NEXT_PUBLIC_API_URL"
    fi
    
    npm run build:mobile
    if [ $? -ne 0 ]; then
        echo "❌ Mobile web build failed"
        exit 1
    fi
    
    # Copy mobile HTML as index.html for Capacitor
    echo "📄 Creating index.html for Capacitor..."
    if [ -f "dist/public/index-mobile.html" ]; then
        cp dist/public/index-mobile.html dist/public/index.html
        echo "✅ Created index.html from index-mobile.html in dist/public/"
    else
        echo "❌ dist/public/index-mobile.html not found"
        echo "📁 Listing dist/public directory:"
        ls -la dist/public/
        exit 1
    fi
    echo "✅ Mobile web app built successfully"
    
    # Return to root directory
    cd ../..
}

# Sync with Capacitor
sync_capacitor() {
    echo "🔄 Syncing with Android platform..."
    echo "📁 Changing to user-app directory..."
    cd apps/user-app || { echo "❌ Failed to change to apps/user-app directory"; exit 1; }
    
    npx cap sync android
    if [ $? -ne 0 ]; then
        echo "❌ Capacitor sync failed"
        exit 1
    fi
    echo "✅ Capacitor sync completed"
    
    # Return to root directory
    cd ../..
}

# Build APK
build_apk() {
    echo "🚀 Building APK..."
    cd android
    
    # Clean previous builds
    ./gradlew clean
    
    # Build debug APK (signed with debug keystore for easy installation)
    ./gradlew assembleDebug
    
    if [ $? -eq 0 ]; then
        echo "✅ APK built successfully!"
        
        # Check for the actual APK file (debug APK)
        if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
            APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
            echo "📱 APK location: $APK_PATH (debug, signed)"
        else
            echo "⚠️  Could not find APK file, listing directory:"
            ls -la app/build/outputs/apk/debug/
            exit 1
        fi
        
        # Copy APK to root directory for easy access
        cp "$APK_PATH" ../foodiefinds-user-app-ui-fixes.apk
        echo "📁 APK copied to: foodiefinds-user-app-ui-fixes.apk"
    else
        echo "❌ APK build failed"
        exit 1
    fi
    
    cd ..
}

# Main execution
main() {
    check_requirements
    build_web_app
    sync_capacitor
    build_apk
    
    echo ""
    echo "🎉 Success! Your FoodieFinds User App APK is ready!"
    echo "📱 Install it on your Android device: foodiefinds-user-app-ui-fixes.apk"
    echo ""
    echo "Features included:"
    echo "  ✅ Video calling with live balance tracking"
    echo "  ✅ Gift sending during calls"
    echo "  ✅ Wallet recharge system"
    echo "  ✅ Random match functionality"
    echo "  ✅ Call warnings for low balance"
    echo "  ✅ Creator browsing and filtering"
    echo "  ✅ UI overlapping fixes (safe area handling)"
    echo "  ✅ Video/audio call layout switching"
    echo "  ✅ Balance monitoring and auto-disconnection"
    echo "  ✅ Call simulation API integration"
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi