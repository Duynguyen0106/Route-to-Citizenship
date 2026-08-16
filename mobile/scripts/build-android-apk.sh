#!/usr/bin/env bash
# Build a sideloadable Android APK. Uses the debug keystore until a Play upload key is added.
# Requires ANDROID_HOME (Android SDK) and JDK 17+.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${ANDROID_HOME:-}" && -d "$HOME/Android/Sdk" ]]; then
  export ANDROID_HOME="$HOME/Android/Sdk"
fi
if [[ -z "${ANDROID_HOME:-}" ]]; then
  echo "Set ANDROID_HOME to your Android SDK path." >&2
  exit 1
fi
export ANDROID_SDK_ROOT="$ANDROID_HOME"

npx expo prebuild --platform android --non-interactive
cd android
echo "sdk.dir=$ANDROID_HOME" > local.properties
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a

echo
echo "APK: $ROOT/android/app/build/outputs/apk/release/app-release.apk"
echo "Signed with the debug keystore — fine for device testing, not for Play Store."
