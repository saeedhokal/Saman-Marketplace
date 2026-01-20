# Codemagic Setup Guide - Build iOS App Without a Mac

This guide walks you through setting up Codemagic to build and publish your Saman Marketplace iOS app to the App Store - **no Mac required!**

## What is Codemagic?

Codemagic is a cloud-based CI/CD service that builds iOS apps on their Mac servers. You upload your code, they build it, and can even submit it directly to the App Store.

**Pricing:**
- Free tier: 500 build minutes/month (enough for ~4-5 builds)
- Pay-as-you-go: $0.095/minute after free tier

## Prerequisites

1. **Apple Developer Account** ($99/year) - https://developer.apple.com
2. **Codemagic Account** (free) - https://codemagic.io
3. **Your code in a Git repository** (GitHub, GitLab, or Bitbucket)

## Step 1: Create Apple Developer Account

1. Go to https://developer.apple.com/programs/
2. Click "Enroll" and follow the steps
3. Pay the $99/year fee
4. Wait for approval (usually 24-48 hours)

## Step 2: Create App ID in Apple Developer Portal

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click the "+" button
3. Select "App IDs" and click Continue
4. Select "App" and click Continue
5. Enter:
   - Description: Saman Marketplace
   - Bundle ID: com.saman.marketplace (Explicit)
6. Click Continue and Register

## Step 3: Create App Store Connect Record

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" then "+"
3. Select "New App"
4. Fill in:
   - Platform: iOS
   - Name: Saman Marketplace
   - Primary Language: English (or Arabic)
   - Bundle ID: com.saman.marketplace
   - SKU: saman-marketplace-001
5. Click Create

Note down the **Apple ID** (number) shown in App Information - you'll need this later.

## Step 4: Create App Store Connect API Key

1. In App Store Connect, go to Users and Access
2. Click "Integrations" tab
3. Click "App Store Connect API"
4. Click "+" to generate a new key
5. Name: Codemagic
6. Access: App Manager
7. Click Generate
8. **Download the .p8 file immediately** (you can only download once!)
9. Note down:
   - Key ID (shown in the table)
   - Issuer ID (shown at the top)

## Step 5: Create Signing Certificate

1. Go to https://developer.apple.com/account/resources/certificates/list
2. Click "+" to create new certificate
3. Select "Apple Distribution" and Continue
4. You'll need to create a Certificate Signing Request (CSR):
   
   **Option A: Use Codemagic's automatic signing (Recommended)**
   - Skip this step - Codemagic can create certificates automatically
   
   **Option B: Manual certificate**
   - Use a Mac (borrow one, use MacinCloud, etc.) to create CSR
   - Upload the CSR and download the certificate

## Step 6: Sign Up for Codemagic

1. Go to https://codemagic.io
2. Click "Start building for free"
3. Sign up with GitHub, GitLab, or Bitbucket
4. Connect your repository

## Step 7: Configure Codemagic

### Add App Store Connect Integration

1. In Codemagic, go to Teams (or Settings)
2. Click "Integrations"
3. Under "App Store Connect", click "Connect"
4. Upload your .p8 key file
5. Enter the Key ID and Issuer ID
6. Click Save

### Configure Code Signing

**Option A: Automatic signing (Recommended)**

1. In your app settings, go to "Distribution"
2. Select "Automatic iOS code signing"
3. Connect your Apple Developer account
4. Codemagic will handle certificates and profiles automatically

**Option B: Manual signing**

1. Upload your .p12 certificate file
2. Upload your provisioning profile
3. Reference them in codemagic.yaml

### Add Environment Variables

1. In your app settings, go to "Environment variables"
2. Add the following variable:
   - **Key:** `APP_ID`
   - **Value:** Your App Store Connect App ID (the number from Step 3)
   - This is the numeric ID shown in App Store Connect under your app's "General" > "App Information"

**Alternative:** You can also edit the `codemagic.yaml` file directly and replace `1234567890` with your actual App ID in the `environment.vars.APP_ID` field.

### Verify Integration Name

Make sure your App Store Connect integration in Codemagic is named exactly `codemagic` (lowercase). This matches the reference in `codemagic.yaml`:
```yaml
integrations:
  app_store_connect: codemagic
```

## Step 8: Push Your Code

1. Download your project from Replit
2. Push to your Git repository:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/saman-marketplace.git
git push -u origin main
```

## Step 9: Start a Build

1. In Codemagic, click on your app
2. Click "Start new build"
3. Select the branch (main)
4. Select the workflow (ios-release)
5. Click "Start new build"

The build will:
1. Install dependencies
2. Build the web app
3. Sync to Capacitor
4. Build the iOS app
5. Sign it with your certificates
6. Upload to TestFlight automatically

## Step 10: Submit to App Store

1. Go to App Store Connect
2. Your build will appear in TestFlight section
3. Test on your device via TestFlight app
4. When ready, go to your app and click "+" for new version
5. Select your build
6. Fill in app information, screenshots, etc.
7. Submit for Review

## Troubleshooting

### Build fails with signing errors
- Ensure your bundle ID matches exactly: com.saman.marketplace
- Check that your App Store Connect API key has App Manager access
- Try using automatic code signing

### Build succeeds but app crashes
- Check that your backend is deployed and accessible
- Update capacitor.config.ts with your production server URL

### "No matching provisioning profiles found"
- Ensure you've created an App ID with the correct bundle identifier
- Try regenerating provisioning profiles in Apple Developer Portal

## Updating Your App

1. Make changes in Replit
2. Download and push to Git
3. Codemagic will automatically build (if triggering is enabled)
4. Or manually start a new build

## Cost Estimate

- Apple Developer Account: $99/year
- Codemagic builds: Free for first 500 minutes/month
- A typical build takes 10-15 minutes
- Free tier allows ~4-5 builds per month

## Support

- Codemagic Docs: https://docs.codemagic.io
- Codemagic Support: support@codemagic.io
- Apple Developer Support: https://developer.apple.com/support/
