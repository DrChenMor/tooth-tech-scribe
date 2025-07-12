
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

console.log("translator function booting");

const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TranslateRequest {
  content: string;
  targetLanguage: string;
  provider: 'google' | 'openai' | 'claude' | 'gemini';
}

async function translateWithGoogle(content: string, targetLanguage: string): Promise<string> {
  if (!googleApiKey) {
    throw new Error("Google API key not configured");
  }

  const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: content,
      target: targetLanguage,
      format: 'html',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Google Translate API error response:", errorData);
    const errorMessage = errorData.error?.message || "Google Translation failed";
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result.data.translations[0].translatedText;
}

async function translateWithOpenAI(content: string, targetLanguage: string): Promise<string> {
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const languageMap: Record<string, string> = {
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'ja': 'Japanese',
    'pt': 'Portuguese',
    'he': 'Hebrew',
    'zh': 'Chinese',
    'ru': 'Russian',
    'it': 'Italian',
    'ko': 'Korean'
  };

  const targetLanguageName = languageMap[targetLanguage] || targetLanguage;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLanguageName}. Preserve the original formatting, HTML tags, and structure. Only respond with the translated text, nothing else.`
        },
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'OpenAI translation failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function translateWithClaude(content: string, targetLanguage: string): Promise<string> {
  if (!anthropicApiKey) {
    throw new Error("Anthropic API key not configured");
  }

  const languageMap: Record<string, string> = {
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'ja': 'Japanese',
    'pt': 'Portuguese',
    'he': 'Hebrew',
    'zh': 'Chinese',
    'ru': 'Russian',
    'it': 'Italian',
    'ko': 'Korean'
  };

  const targetLanguageName = languageMap[targetLanguage] || targetLanguage;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anthropicApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-20250514',
      max_tokens: 4000,
      system: `You are a professional translator. Translate the following text to ${targetLanguageName}. Preserve the original formatting, HTML tags, and structure. Only respond with the translated text, nothing else.`,
      messages: [
        {
          role: 'user',
          content: content
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Claude translation failed');
  }

  const data = await response.json();
  return data.content[0].text;
}

async function translateWithGemini(content: string, targetLanguage: string): Promise<string> {
  if (!googleApiKey) {
    throw new Error("Google API key not configured");
  }

  const languageMap: Record<string, string> = {
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'ja': 'Japanese',
    'pt': 'Portuguese',
    'he': 'Hebrew',
    'zh': 'Chinese',
    'ru': 'Russian',
    'it': 'Italian',
    'ko': 'Korean'
  };

  const targetLanguageName = languageMap[targetLanguage] || targetLanguage;
  const prompt = `Translate the following text to ${targetLanguageName}. Preserve the original formatting, HTML tags, and structure. Only respond with the translated text, nothing else.\n\nText to translate:\n${content}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${googleApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Gemini translation failed');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Add provider alias mapping
const providerAliases = {
  'google-gemini': 'gemini',
  'openai-gpt': 'openai',
  'anthropic-claude': 'claude',
  'google-translate': 'google',
  'gemini': 'gemini',
  'openai': 'openai',
  'claude': 'claude',
  'google': 'google'
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, targetLanguage, provider }: TranslateRequest = await req.json();

    if (!content || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: content or targetLanguage" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize provider using aliases
    const normalizedProvider = providerAliases[provider] || provider;

    console.log(`Translating to ${targetLanguage} using ${normalizedProvider}...`);

    let translatedText: string;

    switch (normalizedProvider) {
      case 'google':
        translatedText = await translateWithGoogle(content, targetLanguage);
        break;
      case 'openai':
        translatedText = await translateWithOpenAI(content, targetLanguage);
        break;
      case 'claude':
        translatedText = await translateWithClaude(content, targetLanguage);
        break;
      case 'gemini':
        translatedText = await translateWithGemini(content, targetLanguage);
        break;
      default:
        throw new Error(`Unsupported translation provider: ${provider}`);
    }

    console.log("Translation successful.");
    return new Response(JSON.stringify({ content: translatedText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unhandled error in translator function:", error);
    let errorMessage = error.message || "An internal server error occurred.";

    if (errorMessage.includes("Cloud Translation API has not been used")) {
      errorMessage = "Google Cloud Translation API is not enabled. Please go to your Google Cloud project, enable the API, wait a few minutes, and then try again.";
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
