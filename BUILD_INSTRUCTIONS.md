# Building and Signing for Google Play Store

## Prerequisites

- Java Development Kit (JDK) 17 or later
- Android SDK
- Node.js and pnpm

## Step 1: Generate a Keystore

**⚠️ IMPORTANT: Keep your keystore file safe and secure. You'll need it to sign all future updates!**

Generate a new keystore file using keytool:

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted to enter:

- Keystore password (remember this!)
- Key password (remember this!)
- Your name and organization details

**IMPORTANT NOTES:**

1. Store the keystore file securely - back it up to a secure location
2. Never commit the keystore file to version control
3. Remember or securely store your passwords - you cannot recover them!
4. Google Play now uses Play App Signing, so this will be your upload key

## Step 2: Configure Gradle Properties

Create `android/gradle.properties` file with your keystore details:

```properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=your_keystore_password
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
```

**⚠️ NEVER commit gradle.properties to version control!**

Add to your `.gitignore` if not already present:

```
android/gradle.properties
android/**/*.keystore
```

## Step 3: Build for Production

### Option A: Build AAB (Recommended for Google Play Store)

AAB (Android App Bundle) is the recommended format for Google Play Store as it allows Google to optimize APKs for different device configurations.

```bash
# Clean build
pnpm run clean:android

# Build AAB
pnpm run build:aab
```

The AAB will be located at:
`android/app/build/outputs/bundle/release/app-release.aab`

### Option B: Build APK (For Testing or Other Distribution)

With ABI splits enabled, you'll get multiple APKs (one per architecture), significantly reducing size:

```bash
# Clean build
pnpm run clean:android

# Build APKs
pnpm run build:apk
```

APKs will be located at:

```
android/app/build/outputs/apk/release/app-armeabi-v7a-release.apk
android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
android/app/build/outputs/apk/release/app-x86-release.apk
android/app/build/outputs/apk/release/app-x86_64-release.apk
```

## Step 4: Test Your Build

Before uploading to Google Play, test the signed build:

```bash
# Install the APK on a device
adb install android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

## Step 5: Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console/)
2. Select your app (or create a new app if first time)
3. Navigate to "Production" or "Testing" track
4. Create a new release
5. Upload the AAB file: `android/app/build/outputs/bundle/release/app-release.aab`
6. Fill in release notes
7. Review and rollout

### First Time Upload

If this is your first upload with a new keystore:

1. Google Play will prompt you to enroll in Play App Signing
2. Follow the prompts to let Google manage your app signing key
3. Your upload key (the one you just created) will be used for all future uploads

## Version Information

Current version:

- Version Name: 1.0.1
- Version Code: 6005

For the next update, increment these values in:

- `app.json`: `"version": "1.0.2"`
- `android/app/build.gradle`: `versionCode 6006` and `versionName "1.0.2"`

## ABI Splits Configuration

Your app is configured to generate separate APKs for each architecture:

- **armeabi-v7a**: 32-bit ARM (older devices)
- **arm64-v8a**: 64-bit ARM (most modern devices)
- **x86**: 32-bit Intel (rare, mostly emulators)
- **x86_64**: 64-bit Intel (rare, mostly emulators)

This significantly reduces the download size for users as they only download the APK for their device's architecture.

When using AAB format, Google Play automatically handles this optimization for you.

## Troubleshooting

### Build Fails Due to Missing Keystore

- Make sure `gradle.properties` exists and has the correct paths
- Verify the keystore file is in the correct location
- Check that passwords are correct (no extra spaces)

### "keystore file not found" Error

- Ensure the path in `gradle.properties` is relative to the `android/app` directory
- Or use an absolute path: `MYAPP_UPLOAD_STORE_FILE=/absolute/path/to/my-upload-key.keystore`

### Version Code Conflict

- Make sure your version code is higher than the previous release
- Version codes must be unique and incrementing

## Security Best Practices

1. ✅ Store keystore in a secure location (not in project directory)
2. ✅ Back up keystore to multiple secure locations
3. ✅ Use a password manager for keystore passwords
4. ✅ Never commit `gradle.properties` or keystore files
5. ✅ Consider using environment variables in CI/CD pipelines
6. ✅ Enroll in Google Play App Signing for additional security

## Additional Resources

- [React Native Android Signing Docs](https://reactnative.dev/docs/signed-apk-android)
- [Google Play Console](https://play.google.com/console/)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)
