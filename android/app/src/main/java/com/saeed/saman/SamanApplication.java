package com.saeed.saman;

import android.app.Application;

import com.tiktok.TikTokBusinessSdk;

/**
 * Application class that initializes the TikTok Business (App Events) SDK on
 * launch so TikTok can attribute Android app installs/opens to its ad
 * campaigns. Mirrors the iOS AppDelegate TikTok initialization.
 *
 * appId   = Google Play package name (com.saman.marketplace)
 * ttAppId = TikTok App ID from TikTok Events Manager (7641237938868748309)
 */
public class SamanApplication extends Application {

    @Override
    public void onCreate() {
        super.onCreate();

        TikTokBusinessSdk.TTConfig ttConfig = new TikTokBusinessSdk.TTConfig(this)
                .setAppId("com.saman.marketplace")
                .setTTAppId("7641237938868748309");

        TikTokBusinessSdk.initializeSdk(ttConfig);
        TikTokBusinessSdk.startTrack();
    }
}
