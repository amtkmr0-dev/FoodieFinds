#!/bin/bash
set -euo pipefail

# FoodieFinds User App - APK Builder
# Source of truth: apps/user-app (Capacitor). Root ./android is orphan — do not build it.

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$ROOT_DIR/apps/user-app"
ANDROID_DIR="$APP_DIR/android"

echo "🍕 FoodieFinds User App - APK Builder"
echo "=================================="
echo "📂 Cap SoT: apps/user-app/android"

check_requirements() {
    echo "🔍 Checking requirements..."
    command -v node >/dev/null || { echo "❌ Node.js not found"; exit 1; }
    command -v java >/dev/null || { echo "❌ Java/JDK not found"; exit 1; }
    if [ -z "${ANDROID_HOME:-}" ]; then
        echo "❌ ANDROID_HOME not set"
        exit 1
    fi
    echo "✅ Requirements check passed"
}

build_web_app() {
    echo "📦 Building mobile web application..."
    cd "$APP_DIR"

    if [ -z "${NEXT_PUBLIC_API_URL:-}" ]; then
        echo "⚠️  NEXT_PUBLIC_API_URL not set — shared default is https://api.foodiefinds.app"
        echo "⚠️  Set an HTTPS URL before release builds, e.g.:"
        echo "    export NEXT_PUBLIC_API_URL=https://your-api.example.com"
    else
        case "$NEXT_PUBLIC_API_URL" in
            http://*)
                echo "❌ NEXT_PUBLIC_API_URL must be HTTPS (got: $NEXT_PUBLIC_API_URL)"
                exit 1
                ;;
            https://*)
                echo "✅ Using HTTPS API_BASE_URL: $NEXT_PUBLIC_API_URL"
                ;;
            *)
                echo "❌ NEXT_PUBLIC_API_URL must start with https://"
                exit 1
                ;;
        esac
    fi

    npm run build:mobile

    echo "📄 Creating index.html for Capacitor..."
    if [ -f "dist/public/index-mobile.html" ]; then
        cp dist/public/index-mobile.html dist/public/index.html
        echo "✅ Created index.html from index-mobile.html"
    else
        echo "❌ dist/public/index-mobile.html not found"
        ls -la dist/public/ || true
        exit 1
    fi

    cd "$ROOT_DIR"
}

sync_capacitor() {
    echo "🔄 Syncing Capacitor android (apps/user-app)..."
    cd "$APP_DIR"
    npx cap sync android
    cd "$ROOT_DIR"
    echo "✅ Capacitor sync completed"
}

build_apk() {
    echo "🚀 Building APK from $ANDROID_DIR ..."
    cd "$ANDROID_DIR"

    ./gradlew clean
    ./gradlew assembleDebug

    APK_SRC="app/build/outputs/apk/debug/app-debug.apk"
    if [ ! -f "$APK_SRC" ]; then
        echo "❌ APK not found at $APK_SRC"
        ls -la app/build/outputs/apk/debug/ || true
        exit 1
    fi

    BRANCH="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD | tr '/ ' '--')"
    SHORT_SHA="$(git -C "$ROOT_DIR" rev-parse --short HEAD)"
    OUT_NAME="foodiefinds-user-app-${BRANCH}-${SHORT_SHA}.apk"
    OUT_PATH="$ROOT_DIR/$OUT_NAME"

    cp "$APK_SRC" "$OUT_PATH"
    echo "✅ APK built: $OUT_PATH"
    echo "📱 Package must be com.foodiefinds.userapp (verify with aapt dump badging)"

    cd "$ROOT_DIR"
}

main() {
    check_requirements
    build_web_app
    sync_capacitor
    build_apk
    echo ""
    echo "🎉 Done. Install the stamped APK from repo root."
    echo "   Do NOT use root ./android — it is orphaned."
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
