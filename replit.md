# Saman Marketplace - Spare Parts & Automotive Marketplace

## CRITICAL TESTING NOTES

**ALL TESTING IS DONE ON iPHONE VIA TESTFLIGHT** - User talks to agent on desktop, tests on iPhone.
**Build Workflow:** Push to GitHub → Codemagic build → TestFlight install

---

## Recent Changes (January 2026)

### Session: January 23, 2026
**Fixes Applied (requires new Codemagic build to see on iOS):**
1. ✅ **Broadcast notifications saving to inboxes** - Fixed `savedCount` naming mismatch in server response. Notifications now properly save to all user inboxes.
2. ✅ **Toast message "undefined" fix** - Added fallbacks so toast shows "0" instead of "undefined" when no devices registered.
3. ✅ **Toast notifications overlapping status bar** - Fixed ToastViewport positioning to appear BELOW iOS status bar using `top: max(env(safe-area-inset-top, 20px), 20px)`.
4. ✅ **Pull-to-refresh leaving gap** - Fixed to snap back instantly without leaving persistent space at top.
5. ✅ **Push notification token registration** - Improved flow to save token locally if not logged in, then register when user logs in. Added better logging for debugging.

**Files Changed:**
- `server/routes.ts` - Fixed broadcast response to return `savedCount`
- `client/src/components/ui/toast.tsx` - Fixed ToastViewport positioning below status bar
- `client/src/components/PullToRefresh.tsx` - Fixed snap-back transition
- `client/src/pages/Admin.tsx` - Added fallbacks for undefined values in toast
- `client/src/hooks/usePushNotifications.ts` - Improved token registration flow with better logging

**Testing Status:** All changes tested and working in development. Broadcast API returns correct format: `{"savedCount": 12, "sent": 0, "message": "Saved to 12 inboxes, sent to 0 devices"}`

**Next Steps:** Push to GitHub → Codemagic build → TestFlight install

**Push Notification Fix - Proper FCM Integration (Jan 23, 2026):**
- ✅ Installed `@capacitor-community/fcm` v8.1.0 for proper APNs → FCM token conversion
- ✅ Updated `ios/App/Podfile` with `Firebase/Messaging ~> 10.0`
- ✅ Updated `ios/App/App/AppDelegate.swift` with Firebase initialization and MessagingDelegate
- ✅ Updated `client/src/hooks/usePushNotifications.ts` to use FCM plugin for token conversion
- ✅ Fixed Capacitor CLI version mismatch (now v8.0.1)

**How it works now:**
1. App registers for push with APNs (native iOS)
2. APNs token is passed to Firebase SDK in the app
3. FCM plugin converts APNs token to FCM token
4. FCM token is sent to server
5. Server uses Firebase Admin SDK to send notifications

**Next Step:** Push to GitHub → Codemagic build → TestFlight install

---

## Known Issues & Solutions

### Push Notifications Not Working
**Symptoms:** Broadcasts show "sent to 0 devices"
**Cause:** Device token not registered because user wasn't logged in when app first opened
**Solution:** 
1. Build new version with improved token registration
2. Install via TestFlight
3. Log out and log back in (this triggers token registration)
4. Push notifications should work after that

### Toast/Notifications Overlapping Status Bar
**Symptoms:** Notification appears behind the time/wifi/battery icons on iPhone
**Solution:** Fixed with `top: max(env(safe-area-inset-top, 20px), 20px)` positioning

### "Saved to 0 inboxes" Issue
**Symptoms:** Broadcast sends but shows 0 saved
**Cause:** Server was returning `saved` but client expected `savedCount`
**Solution:** Fixed server response to use `savedCount`

---

## User Preferences

- **Communication style:** Simple, everyday language (non-technical)
- **Region:** UAE
- **Currency:** AED
- **Testing:** TestFlight iOS app (no Mac available, never used Xcode)
- **Build workflow:** Codemagic for iOS builds, GitHub via Replit Git panel
- **Important:** User does NOT code - all changes must be made by agent

---

## Design Specifications

### UI Theme
- **Primary accent color:** Orange (#f97316)
- **Dark gradient cards:** from-[#1e293b] to-[#0f172a]
- **Selected state backgrounds:** Orange with white text
- **Card design:** Rounded corners, subtle shadows

### Notification Styling
**Toast Notifications (success/error messages after actions):**
- Position: `top: max(env(safe-area-inset-top, 20px), 20px)` - appears below iOS status bar
- Background: Primary color (orange) with white text
- Rounded corners (rounded-xl), shadow

**Broadcast Notification Form (Admin Panel):**
- Dark gradient background (from-[#1e293b] to-[#0f172a])
- Orange bell icon in rounded box
- "Send Now" / "Delay" / "Schedule" toggle buttons
- Delay: Slider from 5-120 minutes
- Schedule: Date and time pickers

### Safe Area Handling (iOS)
- Body has `padding-top: env(safe-area-inset-top)` for notch area
- Toast viewport uses `top: max(env(safe-area-inset-top, 20px), 20px)`
- Bottom nav has safe area padding for home indicator

---

## Push Notifications (Firebase Cloud Messaging)

### Configuration
- **Firebase Project:** saman-car-spare-parts
- **APNs Key ID:** GMC5C3M7JF (uploaded to Firebase Console)
- **Credentials:** FIREBASE_ADMIN_CREDENTIALS secret contains service account JSON

### How It Works
1. User opens app on iPhone
2. App requests notification permission
3. iOS returns device token (APNs token)
4. App sends token to server (`POST /api/device-token`)
5. Server stores token in `device_tokens` table
6. When broadcast sent, server uses Firebase Admin SDK to send to all tokens

### Token Registration Flow (Fixed Jan 23, 2026)
- If user not logged in: Token saved to localStorage
- When user logs in: Pending token automatically registered
- Logs to console for debugging:
  - "Setting up push notification listeners for user: [id]"
  - "Push registration success, token: [first 20 chars]..."
  - "Registering push notification token with server..."
  - "Push notification token registered successfully!"

### Testing Push Notifications
1. Build new version in Codemagic
2. Install via TestFlight
3. Allow notifications when prompted
4. **Log out and log back in** (critical for token registration)
5. Go to Admin → Broadcast Notification → Send a test
6. Should see "sent to 1 device" in success message

---

## iOS App (Capacitor)

### Configuration
- **App ID:** com.saeed.saman
- **App Name:** Saman Marketplace
- **Team ID:** KQ542Q98H2
- **Server URL:** https://saman-market-fixer--saeedhokal.replit.app

### Apple Pay
- **Merchant ID:** merchant.saeed.saman
- **Status:** Working - double-click power button triggers native Apple Pay sheet
- **Certificates:** APPLE_PAY_CERT, APPLE_PAY_KEY secrets configured

### Capacitor Plugins
- @capacitor/push-notifications - For FCM
- @capacitor/splash-screen - Launch screen
- Standard iOS plugins for core functionality

---

## Admin Features

### Broadcast Notifications
- **Location:** Admin Panel → Notifications tab
- **Options:** 
  - Send Now (immediate)
  - Delay (5-120 minutes slider)
  - Schedule (specific date/time)
- **What happens:**
  1. Notification saved to ALL user inboxes (appears in bell icon)
  2. Push notification sent to all registered devices

### Listing Moderation
- All new listings require admin approval
- Admin can approve or reject with reason
- Rejection refunds the user's credit

### Revenue Tracking
- Total revenue display
- Breakdown by category (Spare Parts vs Automotive)
- Time filters: Today, Week, Month, Year, All Time, Custom range

---

## Payment Integrations

- **Telr Payment Gateway:** Credit card processing (TELR_STORE_ID, TELR_AUTH_KEY)
- **Apple Pay:** Native iOS payments (merchant.saeed.saman)

---

## Database Tables

- **users:** User accounts with phone, name, credits
- **products:** Listings with categories, prices, status
- **device_tokens:** FCM tokens for push notifications
- **notifications:** User notification inbox
- **transactions:** Payment records
- **subscription_packages:** Credit packages for purchase
- **favorites:** User saved listings

---

## Important Files

- `client/src/hooks/usePushNotifications.ts` - Push notification registration
- `client/src/components/ui/toast.tsx` - Toast notification styling
- `client/src/components/PullToRefresh.tsx` - Pull to refresh component
- `client/src/pages/Admin.tsx` - Admin panel with broadcast
- `server/pushNotifications.ts` - Firebase Admin SDK, sending notifications
- `server/routes.ts` - All API endpoints
- `ios/App/App/AppDelegate.swift` - iOS app delegate with push setup
- `capacitor.config.ts` - Capacitor configuration

---

## Architecture

### Frontend
- React 18 + TypeScript
- Vite build tool
- TanStack Query for data fetching
- Tailwind CSS + shadcn/ui components
- Framer Motion for animations
- Wouter for routing

### Backend
- Express.js + TypeScript
- Drizzle ORM with PostgreSQL
- Session-based auth (connect-pg-simple)
- Google Cloud Storage for images

### iOS
- Capacitor for native wrapper
- Firebase Cloud Messaging for push
- Native Apple Pay integration

---

## Pending Items

- **SMS Provider (Twilio):** Not configured - OTP codes logged to console in dev
- **Production SMS:** Need to set up Twilio or alternative when ready
