import dubaiSkylineBg from "@/assets/images/dubai-skyline-bg.png";
import samanLogo from "@assets/ChatGPT_Image_Feb_4,_2026,_03_33_07_PM_1770204799107.png";
import { SiApple, SiGoogleplay } from "react-icons/si";

export default function Downloads() {
  const appStoreUrl = "https://apps.apple.com/kh/app/saman-marketplace/id6744526430";
  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.saman.marketplace";

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${dubaiSkylineBg})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12 text-center">
        <div className="mb-6">
          <img 
            src={samanLogo} 
            alt="Saman Marketplace" 
            className="w-64 mx-auto"
          />
        </div>
        
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-white/5">
          <h2 className="text-xl font-semibold text-white mb-2">
            Download the App
          </h2>
          <p className="text-white/70 text-sm mb-8">
            Buy and sell spare parts & vehicles in the UAE
          </p>
          
          <div className="space-y-4">
            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-black rounded-xl text-white font-medium hover:bg-black/80 transition-colors"
              data-testid="link-app-store"
            >
              <SiApple className="w-7 h-7" />
              <div className="text-left">
                <div className="text-xs text-white/70">Download on the</div>
                <div className="text-lg font-semibold">App Store</div>
              </div>
            </a>
            
            <a
              href={playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-black rounded-xl text-white font-medium hover:bg-black/80 transition-colors"
              data-testid="link-play-store"
            >
              <SiGoogleplay className="w-6 h-6" />
              <div className="text-left">
                <div className="text-xs text-white/70">Get it on</div>
                <div className="text-lg font-semibold">Google Play</div>
              </div>
            </a>
          </div>
        </div>
        
        <p className="text-white/50 text-xs mt-8">
          © 2026 Saman Marketplace. All rights reserved.
        </p>
      </div>
    </div>
  );
}
