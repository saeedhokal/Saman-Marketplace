import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import samanLogo from "@/assets/saman-logo.jpg";

export default function LanguageSelect() {
  const { setLanguage, setHasSelectedLanguage, t } = useLanguage();

  const handleSelectLanguage = (lang: 'en' | 'ar') => {
    setLanguage(lang);
    setHasSelectedLanguage(true);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12" 
      style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #3d3d3d 100%)' }}
    >
      <Card className="w-full max-w-md border-2 p-8" style={{ borderColor: '#f97316' }}>
        <div className="text-center">
          <img 
            src={samanLogo} 
            alt="Saman Marketplace" 
            className="mx-auto mb-6 w-24 h-24 rounded-2xl object-cover shadow-lg"
          />
          
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#f97316' }}>
            Choose Your Language
          </h1>
          <p className="text-lg font-semibold mb-1" style={{ color: '#f97316' }}>
            اختر لغتك
          </p>
          <p className="text-muted-foreground mb-8">
            Select your preferred language
          </p>

          <div className="space-y-4">
            <Button 
              onClick={() => handleSelectLanguage('en')}
              className="w-full h-14 text-lg font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white"
              data-testid="button-english"
            >
              English
            </Button>
            
            <Button 
              onClick={() => handleSelectLanguage('ar')}
              className="w-full h-14 text-lg font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white"
              style={{ fontFamily: 'inherit' }}
              data-testid="button-arabic"
            >
              العربية
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            You can change this later in Settings
          </p>
          <p className="text-sm text-muted-foreground" dir="rtl">
            يمكنك تغيير هذا لاحقاً من الإعدادات
          </p>
        </div>
      </Card>
    </div>
  );
}
