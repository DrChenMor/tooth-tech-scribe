// COMPLETELY FIXED supabase/functions/translator/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

console.log("translator function booting");

const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

interface TranslateRequest {
  content: string;
  targetLanguage: string;
  provider: 'google' | 'openai' | 'claude' | 'gemini';
}

// 🔥 SIMPLE BUT EFFECTIVE: Minimal protection that actually works
function protectCodeBlocks(content: string): { protected: string; codeBlocks: string[] } {
  const codeBlocks: string[] = [];
  let protected = content;
  
  // Only protect actual code blocks - nothing else
  protected = protected.replace(/```[\s\S]*?```/g, (match) => {
    const index = codeBlocks.length;
    codeBlocks.push(match);
    return `CODEBLOCK_PLACEHOLDER_${index}`;
  });
  
  return { protected, codeBlocks };
}

function restoreCodeBlocks(content: string, codeBlocks: string[]): string {
  let restored = content;
  
  codeBlocks.forEach((block, index) => {
    restored = restored.replace(`CODEBLOCK_PLACEHOLDER_${index}`, block);
  });
  
  return restored;
}

// 🔥 CRITICAL: Clean up any translation artifacts
function cleanTranslationArtifacts(content: string): string {
  return content
    // Remove any "TRANSLATE##" artifacts
    .replace(/TRANSLATE##/g, '')
    .replace(/TRANSLATE#/g, '')
    // Remove orphaned ## that aren't headings
    .replace(/(\n|^)##(\s*)$/gm, '')
    // Fix spacing around headings
    .replace(/(\n|^)(#{1,6})\s*([^\n]+)(\n|$)/gm, '\n\n$2 $3\n\n')
    // Fix double spaces
    .replace(/  +/g, ' ')
    // Fix excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Clean up any leftover artifacts
    .replace(/_TRANSLATE[^_]*_/g, '')
    .replace(/__STRUCTURE[^_]*__/g, '')
    .replace(/__OPEN___/g, '')
    .replace(/__CLOSE__/g, '')
    .trim();
}

// Enhanced AI translation with MUCH better prompts
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
    'ar': 'Arabic',
    'zh': 'Chinese',
    'ru': 'Russian',
    'it': 'Italian',
    'ko': 'Korean'
  };

  const targetLanguageName = languageMap[targetLanguage] || targetLanguage;
  
  // Only protect code blocks
  const { protected: protectedContent, codeBlocks } = protectCodeBlocks(content);
  
  const prompt = `You are a professional translator. Your task is to translate the following text to ${targetLanguageName}.

CRITICAL RULES:
1. Translate ALL text content including headings, subtitles, and body text
2. Keep markdown formatting EXACTLY the same (# ## ### - * etc.)
3. Do NOT translate: CODEBLOCK_PLACEHOLDER_0, CODEBLOCK_PLACEHOLDER_1, etc. - keep these EXACTLY as they are
4. Maintain the EXACT same paragraph structure and line breaks
5. For RTL languages like Hebrew/Arabic: translate the text but keep markdown symbols in their original position

Here is the text to translate:

${protectedContent}

Translate to ${targetLanguageName}:`;

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
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Gemini translation failed');
  }

  const data = await response.json();
  let translatedText = data.candidates[0].content.parts[0].text;
  
  // Restore code blocks and clean artifacts
  translatedText = restoreCodeBlocks(translatedText, codeBlocks);
  translatedText = cleanTranslationArtifacts(translatedText);
  
  console.log('🌍 Gemini: Translation completed');
  return translatedText;
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
    'ar': 'Arabic',
    'zh': 'Chinese',
    'ru': 'Russian',
    'it': 'Italian',
    'ko': 'Korean'
  };

  const targetLanguageName = languageMap[targetLanguage] || targetLanguage;

  // Only protect code blocks
  const { protected: protectedContent, codeBlocks } = protectCodeBlocks(content);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate to ${targetLanguageName} while preserving ALL markdown formatting. Translate ALL text including headings and subtitles. Do NOT translate CODEBLOCK_PLACEHOLDER_X placeholders - keep them exactly as they are. Maintain exact paragraph structure.`
        },
        {
          role: 'user',
          content: protectedContent
        }
      ],
      max_tokens: 4000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'OpenAI translation failed');
  }

  const data = await response.json();
  let translatedText = data.choices[0].message.content;
  
  // Restore code blocks and clean artifacts
  translatedText = restoreCodeBlocks(translatedText, codeBlocks);
  translatedText = cleanTranslationArtifacts(translatedText);
  
  return translatedText;
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
    'ar': 'Arabic',
    'zh': 'Chinese',
    'ru': 'Russian',
    'it': 'Italian',
    'ko': 'Korean'
  };

  const targetLanguageName = languageMap[targetLanguage] || targetLanguage;

  // Only protect code blocks
  const { protected: protectedContent, codeBlocks } = protectCodeBlocks(content);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anthropicApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: `You are a professional translator. Translate to ${targetLanguageName} while preserving ALL markdown formatting. Translate ALL text including headings and subtitles. Do NOT translate CODEBLOCK_PLACEHOLDER_X placeholders - keep them exactly as they are. Maintain exact paragraph structure.`,
      messages: [
        {
          role: 'user',
          content: protectedContent
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Claude translation failed');
  }

  const data = await response.json();
  let translatedText = data.content[0].text;
  
  // Restore code blocks and clean artifacts
  translatedText = restoreCodeBlocks(translatedText, codeBlocks);
  translatedText = cleanTranslationArtifacts(translatedText);
  
  return translatedText;
}

async function translateWithGoogle(content: string, targetLanguage: string): Promise<string> {
  if (!googleApiKey) {
    throw new Error("Google API key not configured");
  }

  console.log('🌍 Google Translate: Using simple protection...');
  
  // Only protect code blocks
  const { protected: protectedContent, codeBlocks } = protectCodeBlocks(content);
  
  const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: protectedContent,
      target: targetLanguage,
      format: 'text',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Google Translate API error response:", errorData);
    const errorMessage = errorData.error?.message || "Google Translation failed";
    throw new Error(errorMessage);
  }

  const result = await response.json();
  let translatedText = result.data.translations[0].translatedText;
  
  // Restore code blocks and clean artifacts
  translatedText = restoreCodeBlocks(translatedText, codeBlocks);
  translatedText = cleanTranslationArtifacts(translatedText);
  
  console.log('🌍 Google Translate: Simple protection completed');
  return translatedText;
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

    console.log(`🔥 SIMPLIFIED TRANSLATOR: Translating to ${targetLanguage} using ${normalizedProvider}...`);
    console.log(`📝 Content preview: ${content.substring(0, 200)}...`);

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

    console.log("✅ Simplified translation successful.");
    console.log(`📝 Translated preview: ${translatedText.substring(0, 200)}...`);
    
    return new Response(JSON.stringify({ content: translatedText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unhandled error in simplified translator function:", error);
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