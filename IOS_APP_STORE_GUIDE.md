# Saman Marketplace - iOS App Store Submission Guide

## Choose Your Build Method

### Option A: No Mac Required - Use Codemagic (Recommended)
If you don't have a Mac, use **Codemagic** to build your iOS app in the cloud.
See **CODEMAGIC_SETUP_GUIDE.md** for complete instructions.

### Option B: Build on Mac
If you have access to a Mac, follow the steps below.

---

## Prerequisites (Mac Build)

Before you begin, you'll need:
1. **A Mac computer** with macOS 13 or later
2. **Xcode 15+** installed from the Mac App Store
3. **Apple Developer Account** ($99/year) - https://developer.apple.com
4. **CocoaPods** installed: `sudo gem install cocoapods`

## Step 1: Download the Project

Download this entire project to your Mac. You can:
- Use Git: `git clone [your-repo-url]`
- Or download as ZIP from Replit and extract

## Step 2: Install Dependencies

Open Terminal, navigate to the project folder, and run:

```bash
npm install
npm run build
npx cap sync ios
```

## Step 3: Install iOS Dependencies

Navigate to the iOS folder and install CocoaPods:

```bash
cd ios/App
pod install
cd ../..
```

## Step 4: Open in Xcode

Open the iOS project in Xcode:

```bash
npx cap open ios
```

Or manually open `ios/App/App.xcworkspace` in Xcode.

## Step 5: Configure App Settings

In Xcode:

1. **Select the "App" target** in the left sidebar
2. **General Tab:**
   - Bundle Identifier: `com.saman.marketplace` (or your own)
   - Version: 1.0.0
   - Build: 1
   - Display Name: Saman Marketplace

3. **Signing & Capabilities:**
   - Team: Select your Apple Developer Team
   - Signing Certificate: Distribution
   - Check "Automatically manage signing"

## Step 6: Add App Icons

Replace the placeholder icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:

Required sizes:
- 20x20 (2x, 3x)
- 29x29 (2x, 3x)
- 40x40 (2x, 3x)
- 60x60 (2x, 3x)
- 76x76 (1x, 2x)
- 83.5x83.5 (2x)
- 1024x1024 (App Store)

Use a tool like https://appicon.co to generate all sizes from one 1024x1024 image.

## Step 7: Add Splash Screen (Launch Screen)

Edit `ios/App/App/Assets.xcassets/Splash.imageset/` to add your splash screen image.

Or customize `ios/App/App/Base.lproj/LaunchScreen.storyboard` in Xcode.

## Step 8: Configure Backend URL

**IMPORTANT:** Before submitting, you need to host your backend somewhere accessible.

Option A: **Use Replit Deployments**
1. In Replit, click "Deploy" to publish your backend
2. Get your deployment URL (e.g., `https://your-app.replit.app`)
3. Update `capacitor.config.ts`:

```typescript
server: {
  url: 'https://your-app.replit.app',
  cleartext: false,
}
```

Option B: **Host on your own server**
Deploy the backend to AWS, DigitalOcean, or any hosting provider.

## Step 9: Build for App Store

1. In Xcode, select **Product > Archive**
2. Wait for the build to complete
3. In the Organizer window, click **Distribute App**
4. Select **App Store Connect**
5. Follow the prompts to upload

## Step 10: App Store Connect Setup

Go to https://appstoreconnect.apple.com:

1. **Create New App:**
   - Bundle ID: com.saman.marketplace
   - Name: Saman Marketplace
   - Primary Language: English (or Arabic)

2. **App Information:**
   - Category: Shopping
   - Subcategory: Marketplace

3. **Pricing and Availability:**
   - Price: Free
   - Availability: Select UAE and other countries

4. **App Privacy:**
   - Answer privacy questions about data collection

5. **Screenshots:**
   - Take screenshots on iPhone 15 Pro Max (6.7")
   - Take screenshots on iPhone 8 Plus (5.5")
   - Upload to App Store Connect

6. **App Description:**
   ```
   Saman Marketplace is the UAE's premier platform for buying and selling automotive parts and vehicles.
   
   Features:
   - Browse thousands of spare parts and vehicles
   - List your items for sale
   - Contact sellers directly via phone or WhatsApp
   - Save your favorite listings
   - Secure phone verification
   ```

7. **Keywords:**
   ```
   cars, automotive, spare parts, UAE, Dubai, marketplace, buy, sell, vehicles
   ```

## Step 11: Submit for Review

1. Select your uploaded build
2. Complete all required fields
3. Click **Submit for Review**

Apple typically reviews apps within 24-48 hours.

## Updating the App

When you make changes:

1. Update the code in Replit
2. Download to your Mac
3. Run: `npm run build && npx cap sync ios`
4. Increment the build number in Xcode
5. Archive and upload again

**Note:** Always run `npm run build && npx cap sync ios` after changing `capacitor.config.ts` to apply the changes to the iOS project.

## Troubleshooting

**Build fails with signing errors:**
- Ensure you've selected your team in Signing & Capabilities
- Check your certificates are valid in Keychain Access

**App rejected:**
- Apple provides feedback in App Store Connect
- Common issues: missing privacy policy, incomplete app, crashes

**Backend not connecting:**
- Ensure your Replit deployment is running
- Check the URL in capacitor.config.ts is correct
- Verify HTTPS is working

## Support

For Capacitor issues: https://capacitorjs.com/docs
For App Store help: https://developer.apple.com/support/
