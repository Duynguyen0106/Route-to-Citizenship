# Phone app (iOS and Android)

Native Expo app sharing the website TypeScript route engine (`lib/calculate`, `lib/onboarding`, `lib/next-actions`). It is **not** a WebView wrapper of the site or of GOV.UK.

## This is not immigration advice

The app is a planning aid. Confirm every date and fee on [GOV.UK](https://www.gov.uk/browse/visas-immigration) or with an OISC-regulated adviser. Official pages open in the system browser.

Guest plans are stored on-device with AsyncStorage. The encrypted document vault stays website-only and is never uploaded. Never enter a passport number.

## Run

```bash
cd mobile
npm install
npx expo start
```

Then scan the QR code with Expo Go (Android) or the Camera app (iOS).

## Native binaries

This repo uses [EAS Build](https://docs.expo.dev/build/introduction/). From `mobile/`:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview   # APK for devices
eas build --platform ios --profile preview       # iOS simulator build
eas build --platform all --profile production    # Play .aab + App Store IPA
```

iOS device and App Store binaries need an Apple Developer account and a Mac or EAS. A Linux host cannot compile a signed IPA locally.

Android APK can also be built locally after installing the Android SDK:

```bash
cd mobile
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

Bundle IDs: `uk.routetocitizenship.app`.
