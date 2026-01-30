import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

interface TranslationResult {
  translatedTitle: string;
  translatedDescription: string;
  isTranslated: boolean;
}

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect if text contains Arabic
  const containsArabic = useCallback((text: string): boolean => {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicPattern.test(text);
  }, []);

  // Detect language of text
  const detectLanguage = useCallback((text: string): "arabic" | "english" | "mixed" => {
    const hasArabic = containsArabic(text);
    const hasLatin = /[a-zA-Z]/.test(text);
    
    if (hasArabic && hasLatin) return "mixed";
    if (hasArabic) return "arabic";
    return "english";
  }, [containsArabic]);

  // Get the target language (opposite of detected)
  const getTargetLanguage = useCallback((text: string): "arabic" | "english" => {
    const detected = detectLanguage(text);
    return detected === "arabic" ? "english" : "arabic";
  }, [detectLanguage]);

  // Translate a single text
  const translateText = useCallback(async (
    text: string,
    targetLanguage: "arabic" | "english"
  ): Promise<string> => {
    if (!text) return text;
    
    setIsTranslating(true);
    setError(null);
    
    try {
      const response = await apiRequest("POST", "/api/translate", {
        text,
        targetLanguage
      });
      const data = await response.json();
      return data.translated;
    } catch (err) {
      setError("Translation failed");
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  // Translate listing (title + description)
  const translateListing = useCallback(async (
    title: string,
    description: string,
    targetLanguage: "arabic" | "english"
  ): Promise<TranslationResult> => {
    setIsTranslating(true);
    setError(null);
    
    try {
      const response = await apiRequest("POST", "/api/translate/listing", {
        title,
        description,
        targetLanguage
      });
      const data = await response.json();
      return {
        translatedTitle: data.translatedTitle,
        translatedDescription: data.translatedDescription,
        isTranslated: true
      };
    } catch (err) {
      setError("Translation failed");
      return {
        translatedTitle: title,
        translatedDescription: description,
        isTranslated: false
      };
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return {
    isTranslating,
    error,
    containsArabic,
    detectLanguage,
    getTargetLanguage,
    translateText,
    translateListing
  };
}
