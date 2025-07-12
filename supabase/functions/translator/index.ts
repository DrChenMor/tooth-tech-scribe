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

// 🔥 NEW: Helper functions to preserve and restore markdown formatting
function protectMarkdownFormatting(content: string): string {
  // Protect markdown syntax from being translated
  let protectedContent = content;
  
  // Protect headings
  protectedContent = protectedContent.replace(/^(#{1,6})\s+/gm, '___HEADING$1___ ');
  
  // Protect bullet points
  protectedContent = protectedContent.replace(/^(\s*)[\-\*]\s+/gm, '$1___BULLET___ ');
  
  // Protect numbered lists
  protectedContent = protectedContent.replace(/^(\s*)(\d+)\.\s+/gm, '$1___NUMBER$2___ ');
  
  // Protect bold/italic
  protectedContent = protectedContent.replace(/\*\*(.*?)\*\*/g, '___BOLD___$1___/BOLD___');
  protectedContent = protectedContent.replace(/\*(.*?)\*/g, '___ITALIC___$1___/ITALIC___');
  
  return protectedContent;
}

function restoreMarkdownFormatting(content: string): string {
  // Restore protected markdown syntax
  let restoredContent = content;
  
  // Restore headings
  restoredContent = restoredContent.replace(/___HEADING(#{1,6})___\s+/g, '$1 ');
  
  // Restore bullet points
  restoredContent = restoredContent.replace(/(\s*)___BULLET___\s+/g, '$1- ');
  
  // Restore numbered lists
  restoredContent = restoredContent.replace(/(\s*)___NUMBER(\d+)___\s+/g, '$1$2. ');
  
  // Restore bold/italic
  restoredContent = restoredContent.replace(/___BOLD___(.*?)___\/BOLD___/g, '**$1**');
  restoredContent = restoredContent.replace(/___ITALIC___(.*?)___\/ITALIC___/g, '*$1*');
  
  return restoredContent;
}

function fixTextStructure(content: string, targetLanguage: string): string {
  console.log('🔧 Fixing text structure for language:', targetLanguage);
  
  let fixedContent = content;
  
  // 🔥 CRITICAL: Ensure proper paragraph separation
  // Split on double newlines and rejoin with proper spacing
  const paragraphs = fixedContent.split(/\n\s*\n/);
  const cleanParagraphs = paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => {
      // Ensure headings are on their own lines
      p = p.replace(/^(#{1,6}\s+)/gm, '\n$1').trim();
      
      // Ensure bullet points are properly spaced
      p = p.replace(/^(\s*[-*]\s+)/gm, '\n$1').trim();
      
      // Ensure numbered lists are properly spaced
      p = p.replace(/^(\s*\d+\.\s+)/gm, '\n$1').trim();
      
      return p;
    });
  
  fixedContent = cleanParagraphs.join('\n\n');
  
  // 🔥 RTL-specific fixes for Hebrew, Arabic, etc.
  const rtlLanguages = ['he', 'ar', 'fa', 'ur'];
  if (rtlLanguages.includes(targetLanguage)) {
    console.log('🔧 Applying RTL-specific fixes...');
    
    // Ensure RTL text flows correctly while preserving markdown
    fixedContent = fixedContent
      // Fix any reversed markdown syntax
      .replace(/(\s+)##/g, '##$1')
      .replace(/(\s+)###/g, '###$1')
      .replace(/(\s+)-/g, '- ')
      .replace(/(\s+)\*/g, '* ')
      // Ensure proper spacing around Hebrew punctuation
      .replace(/([א-ת])\s*:\s*/g, '$1: ')
      .replace(/([א-ת])\s*\.\s*/g, '$1. ')
      .replace(/([א-ת])\s*,\s*/g, '$1, ');
  }
  
  // 🔥 Final cleanup
  fixedContent = fixedContent
    // Remove excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Ensure headings have proper spacing
    .replace(/^(#{1,6}\s+.*?)(\n)([^#\n])/gm, '$1\n\n$3')
    // Ensure lists have proper spacing
    .replace(/^((?:\s*[-*]\s+.*?\n)+)\n*([^-*\s#])/gm, '$1\n$2')
    .trim();
  
  console.log('🔧 Text structure fixed');
  return fixedContent;
}

// Enhanced translation functions
async function translateWithGoogle(content: string, targetLanguage: string): Promise<string> {
  if (!googleApiKey) {
    throw new Error("Google API key not configured");
  }

  console.log('🌍 Google Translate: Preserving markdown structure...');
  
  // 🔥 NEW: Preserve markdown structure by protecting formatting
  const protectedContent = protectMarkdownFormatting(content);
  
  const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: protectedContent,
      target: targetLanguage,
      format: 'text', // Use text format to preserve structure
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Google Translate API error response:", errorData);
    const errorMessage = errorData.error?.message || "Google Translation failed";
    throw new Error(errorMessage);
  }

  const result = await response.json();
  const translatedText = result.data.translations[0].translatedText;
  
  // 🔥 NEW: Restore markdown formatting and fix structure
  const restoredText = restoreMarkdownFormatting(translatedText);
  const structuredText = fixTextStructure(restoredText, targetLanguage);
  
  console.log('🌍 Google Translate: Structure preserved and enhanced');
  return structuredText;
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
          content: `You are a professional translator. Translate to ${targetLanguageName} while PERFECTLY preserving all markdown formatting, paragraph breaks, headings (##, ###), bullet points, and document structure. For RTL languages, maintain proper text direction but keep all markdown syntax intact. DO NOT merge paragraphs.`
        },
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: 4000,
      temperature: 0.1, // Low temperature for consistent formatting
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'OpenAI translation failed');
  }

  const data = await response.json();
  const translatedText = data.choices[0].message.content;
  
  // 🔥 NEW: Additional structure fixing
  const structuredText = fixTextStructure(translatedText, targetLanguage);
  
  return structuredText;
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
      system: `You are a professional translator. Translate to ${targetLanguageName} while PERFECTLY preserving all markdown formatting, paragraph breaks, headings (##, ###), bullet points, and document structure. For RTL languages, maintain proper text direction but keep all markdown syntax intact. DO NOT merge paragraphs.`,
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
  const translatedText = data.content[0].text;
  
  // 🔥 NEW: Additional structure fixing
  const structuredText = fixTextStructure(translatedText, targetLanguage);
  
  return structuredText;
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
  
  // 🔥 ENHANCED: Better prompt for structure preservation
  const prompt = `You are a professional translator specializing in preserving document structure and formatting.

CRITICAL INSTRUCTIONS:
1. Translate the following text to ${targetLanguageName}
2. PRESERVE ALL markdown formatting (##, ###, *, -, etc.)
3. MAINTAIN paragraph breaks and structure
4. Keep all headings, bullet points, and numbered lists intact
5. For RTL languages like Hebrew/Arabic, ensure proper text direction but keep markdown syntax
6. DO NOT merge paragraphs - keep each paragraph separate
7. Maintain the original document structure exactly

Text to translate:
${content}

Return ONLY the translated text with preserved formatting:`;

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
        temperature: 0.1, // Low temperature for consistent formatting
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Gemini translation failed');
  }

  const data = await response.json();
  const translatedText = data.candidates[0].content.parts[0].text;
  
  // 🔥 NEW: Additional structure fixing for AI-translated text
  const structuredText = fixTextStructure(translatedText, targetLanguage);
  
  console.log('🌍 Gemini: Translation completed with structure preservation');
  return structuredText;
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