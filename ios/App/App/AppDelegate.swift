import UIKit
import Capacitor
import FirebaseCore
import AppTrackingTransparency
import TikTokBusinessSDK

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    // Ensures the TikTok SDK is only started once per app launch.
    private var tikTokStarted = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Initialize Firebase (used for Analytics → Google Ads conversion tracking)
        FirebaseApp.configure()
        return true
    }

    // Ask for App Tracking Transparency permission, then start the TikTok
    // Business SDK so TikTok can attribute app installs/opens to its ad
    // campaigns. The SKAdNetwork entries in Info.plist cover the case where
    // the user declines tracking.
    private func requestTrackingThenStartTikTok() {
        if #available(iOS 14, *) {
            // Small delay so the app is fully foregrounded before iOS shows the prompt.
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                ATTrackingManager.requestTrackingAuthorization { _ in
                    DispatchQueue.main.async {
                        self.startTikTokSdkIfNeeded()
                    }
                }
            }
        } else {
            startTikTokSdkIfNeeded()
        }
    }

    private func startTikTokSdkIfNeeded() {
        guard !tikTokStarted else { return }
        tikTokStarted = true
        // appId = Apple App Store ID, tiktokAppId = TikTok App ID from Events Manager
        let config = TikTokConfig(appId: "6744526430", tiktokAppId: "7641237938868748309")
        TikTokBusiness.initializeSdk(config)
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        application.applicationIconBadgeNumber = 0
        requestTrackingThenStartTikTok()
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
