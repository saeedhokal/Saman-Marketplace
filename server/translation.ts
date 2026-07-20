import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Detect if text contains Arabic characters
export function containsArabic(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
}

// Detect language of text
export function detectLanguage(text: string): "arabic" | "english" | "mixed" {
  const hasArabic = containsArabic(text);
  const hasLatin = /[a-zA-Z]/.test(text);
  
  if (hasArabic && hasLatin) return "mixed";
  if (hasArabic) return "arabic";
  return "english";
}

// Determine the dominant language for mixed-alphabet text
export function dominantLanguage(text: string): "arabic" | "english" {
  const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  return arabicChars >= latinChars ? "arabic" : "english";
}

// Translate text between Arabic and English
export async function translateText(
  text: string,
  targetLanguage: "arabic" | "english"
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const sourceLanguage = targetLanguage === "arabic" ? "English" : "Arabic";
  const targetLang = targetLanguage === "arabic" ? "Arabic" : "English";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini", // Cost-effective model for translation
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLang}. 
Only provide the translation, no explanations or additional text.
Maintain the original formatting and structure.
If the text is already in ${targetLang}, return it as-is.
For product listings or marketplace content, keep brand names and technical terms in their original form.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      reasoning_effort: "minimal",
      max_completion_tokens: 8000,
    });

    const translation = response.choices[0]?.message?.content?.trim();
    if (!translation) {
      console.error("Translation returned empty content. finish_reason:", response.choices[0]?.finish_reason);
    }
    return translation || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text on error
  }
}

// Translate multiple fields at once (more efficient)
export async function translateListing(
  title: string,
  description: string,
  targetLanguage: "arabic" | "english"
): Promise<{ title: string; description: string }> {
  const sourceLanguage = targetLanguage === "arabic" ? "English" : "Arabic";
  const targetLang = targetLanguage === "arabic" ? "Arabic" : "English";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator for a UAE automotive marketplace. Translate from ${sourceLanguage} to ${targetLang}.
Return a JSON object with "title" and "description" keys.
Keep brand names, model numbers, and technical terms in their original form.
Maintain formatting and structure.`,
        },
        {
          role: "user",
          content: JSON.stringify({ title, description }),
        },
      ],
      reasoning_effort: "minimal",
      max_completion_tokens: 16000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("Listing translation returned empty content. finish_reason:", response.choices[0]?.finish_reason);
    }
    const result = JSON.parse(content || "{}");
    return {
      title: result.title || title,
      description: result.description || description,
    };
  } catch (error) {
    console.error("Listing translation error:", error);
    return { title, description };
  }
}
