import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  MoreVertical,
  Download,
  Share2,
  Link as LinkIcon,
  Languages,
  Apple,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { SiGoogleplay } from "react-icons/si";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

export const APP_STORE_URL =
  "https://apps.apple.com/app/id6744526430";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.saman.marketplace";

const STICKY_DOWNLOAD_DISMISSED_KEY = "saman_download_cta_dismissed";

function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function setDark(enabled: boolean) {
  const root = document.documentElement;
  if (enabled) {
    root.classList.add("dark");
    try { localStorage.setItem("theme", "dark"); } catch {}
  } else {
    root.classList.remove("dark");
    try { localStorage.setItem("theme", "light"); } catch {}
  }
}

interface DownloadAppButtonProps {
  variant?: "default" | "compact";
  className?: string;
}

export function DownloadAppButton({ variant = "default", className }: DownloadAppButtonProps) {
  const [open, setOpen] = useState(false);
  const { isRTL } = useLanguage();
  if (isNative()) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size={variant === "compact" ? "sm" : "default"}
          className={cn(
            "bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full",
            variant === "compact" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
            className
          )}
          data-testid="button-download-app"
        >
          <Download className={cn("h-4 w-4", isRTL ? "ml-1.5" : "mr-1.5")} />
          {isRTL ? "حمّل التطبيق" : "Download App"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-secondary transition-colors"
          data-testid="link-app-store"
        >
          <Apple className="h-5 w-5" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-muted-foreground">Download on the</span>
            <span className="text-sm font-semibold">App Store</span>
          </div>
        </a>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-secondary transition-colors mt-1"
          data-testid="link-play-store"
        >
          <SiGoogleplay className="h-5 w-5" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-muted-foreground">Get it on</span>
            <span className="text-sm font-semibold">Google Play</span>
          </div>
        </a>
      </PopoverContent>
    </Popover>
  );
}

interface ActionsDropdownProps {
  className?: string;
}

export function ActionsDropdown({ className }: ActionsDropdownProps) {
  const { toast } = useToast();
  const { language, setLanguage, isRTL } = useLanguage();
  const [dark, setDarkState] = useState<boolean>(() => isDarkMode());

  useEffect(() => {
    // Keep the menu's theme indicator in sync if something else toggles dark mode.
    const obs = new MutationObserver(() => setDarkState(isDarkMode()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  if (isNative()) return null;

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = typeof document !== "undefined" ? document.title : "Saman Marketplace";
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, url });
        return;
      } catch {
        // user cancelled or share failed; fall through to copy
      }
    }
    await copyLink();
  };

  const copyLink = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: isRTL ? "تم نسخ الرابط" : "Link copied",
        description: isRTL ? "تم نسخ رابط الصفحة" : "The page link is on your clipboard.",
      });
    } catch {
      toast({
        title: isRTL ? "فشل النسخ" : "Couldn't copy",
        description: url,
      });
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    setDarkState(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", className)}
          aria-label="More actions"
          data-testid="button-actions-dropdown"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={handleShare} className="cursor-pointer" data-testid="action-share">
          <Share2 className="h-4 w-4 mr-2" />
          {isRTL ? "مشاركة الصفحة" : "Share page"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink} className="cursor-pointer" data-testid="action-copy-link">
          <LinkIcon className="h-4 w-4 mr-2" />
          {isRTL ? "نسخ الرابط" : "Copy link"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleLanguage} className="cursor-pointer" data-testid="action-language">
          <Languages className="h-4 w-4 mr-2" />
          {language === "en" ? "العربية" : "English"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer" data-testid="action-theme">
          {dark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
          {dark
            ? (isRTL ? "الوضع الفاتح" : "Light mode")
            : (isRTL ? "الوضع الداكن" : "Dark mode")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer" data-testid="action-app-store">
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            <Apple className="h-4 w-4 mr-2" />
            App Store
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer" data-testid="action-play-store">
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
            <SiGoogleplay className="h-4 w-4 mr-2" />
            Google Play
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Sticky bottom Download App CTA shown only on mobile-web (hidden on
 *  desktop ≥ md and inside the Capacitor native app). Dismissible. */
export function StickyDownloadAppCTA() {
  const { isRTL } = useLanguage();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem(STICKY_DOWNLOAD_DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (isNative() || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(STICKY_DOWNLOAD_DISMISSED_KEY, "1"); } catch {}
  };

  return (
    <div
      className="md:hidden fixed left-2 right-2 z-50 rounded-2xl shadow-2xl border border-orange-400/40 bg-white dark:bg-slate-900 px-3 py-2 flex items-center gap-2"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)" }}
      data-testid="sticky-download-app"
      role="region"
      aria-label="Download the Saman app"
    >
      <div className="h-9 w-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
        <Download className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground leading-tight">
          {isRTL ? "حمّل تطبيق سامان" : "Get the Saman app"}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight">
          {isRTL ? "تجربة أسرع وأسهل" : "Faster, smoother experience"}
        </p>
      </div>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="h-8 px-2.5 rounded-full bg-black text-white text-[11px] font-semibold flex items-center gap-1"
        data-testid="sticky-link-app-store"
      >
        <Apple className="h-3 w-3" /> iOS
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="h-8 px-2.5 rounded-full bg-emerald-600 text-white text-[11px] font-semibold flex items-center gap-1"
        data-testid="sticky-link-play-store"
      >
        <SiGoogleplay className="h-3 w-3" />
      </a>
      <button
        onClick={dismiss}
        className="h-6 w-6 rounded-full hover:bg-secondary flex items-center justify-center shrink-0"
        aria-label="Dismiss"
        data-testid="sticky-download-dismiss"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
