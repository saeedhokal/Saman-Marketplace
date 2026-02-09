import { Link } from "wouter";
import { ArrowLeft, Moon, Sun, Globe, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="relative flex items-center justify-center h-14">
            <Link href="/profile" className={`absolute ${isRTL ? 'right-0' : 'left-0'}`}>
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </Link>
            <h1 className="font-semibold text-lg">{t('settings')}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <section>
            <h2 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 ${isRTL ? 'text-right' : ''}`}>
              {t('appearance')}
            </h2>
            <div className="space-y-4">
              <div className={`flex items-center justify-between py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {darkMode ? (
                    <Moon className="h-5 w-5 text-accent" />
                  ) : (
                    <Sun className="h-5 w-5 text-accent" />
                  )}
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="font-medium">{t('darkMode')}</p>
                    <p className="text-sm text-muted-foreground">{t('darkModeDesc')}</p>
                  </div>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode}
                  data-testid="switch-dark-mode"
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 ${isRTL ? 'text-right' : ''}`}>
              {t('language')}
            </h2>
            <div className="space-y-4">
              <div className={`flex items-center justify-between py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Globe className="h-5 w-5 text-accent" />
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="font-medium">{t('language')}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'English' : 'العربية'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={language === 'en' ? 'default' : 'outline'}
                    onClick={() => setLanguage('en')}
                    className={language === 'en' ? 'bg-accent text-white' : ''}
                    data-testid="button-english"
                  >
                    English
                  </Button>
                  <Button
                    size="sm"
                    variant={language === 'ar' ? 'default' : 'outline'}
                    onClick={() => setLanguage('ar')}
                    className={language === 'ar' ? 'bg-accent text-white' : ''}
                    data-testid="button-arabic"
                  >
                    العربية
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 ${isRTL ? 'text-right' : ''}`}>
              {t('appInfo')}
            </h2>
            <div className="space-y-4">
              <div className={`flex items-center justify-between py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Info className="h-5 w-5 text-accent" />
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="font-medium">{t('version')}</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-app-version">2.0.0</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="pt-4 text-center text-xs text-muted-foreground">
            <p>{t('appName')}</p>
            <p>{t('madeInUAE')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
