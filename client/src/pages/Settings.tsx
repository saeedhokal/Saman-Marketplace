import { Link } from "wouter";
import { ArrowLeft, Moon, Sun, Globe, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";

export default function Settings() {
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
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/profile">
              <button className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Settings</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Appearance
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {darkMode ? (
                    <Moon className="h-5 w-5 text-accent" />
                  ) : (
                    <Sun className="h-5 w-5 text-accent" />
                  )}
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
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
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Language & Region
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Language</p>
                    <p className="text-sm text-muted-foreground">English</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground" data-testid="text-language-status">Coming soon</span>
              </div>
            </div>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              App Info
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Version</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-app-version">1.0.0</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="pt-4 text-center text-xs text-muted-foreground">
            <p>Saman Marketplace</p>
            <p>Made with care in the UAE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
