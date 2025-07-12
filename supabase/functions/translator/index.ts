// FINAL SOLUTION: supabase/functions/translator/index.ts
// This focuses on the REAL problem: preserving structure while translating ALL content
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

console.log("Enhanced translator function booting");

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

// 🔥 STEP 1: Clean input content of any existing artifacts
function cleanInputContent(content: string): string {
  return content
    // Remove any existing translation artifacts
    .replace(/TRANSLATE##/g, '')
    .replace(/TRANSLATE#/g, '')
    .replace(/_TRANSLATE[^_]*_/g, '')
    .replace(/__STRUCTURE[^_]*__/g, '')
    .replace(/__OPEN___/g, '')
    .replace(/__CLOSE__/g, '')
    // Fix any double spaces
    .replace(/  +/g, ' ')
    // Fix excessive newlines but preserve structure
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// 🔥 STEP 2: Post-process to ensure perfect markdown structure
function ensurePerfectMarkdown(content: string): string {
  let lines = content.split('\n');
  let result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Clean any remaining artifacts
    line = line
      .replace(/TRANSLATE##/g, '')
      .replace(/TRANSLATE#/g, '')
      .replace(/_TRANSLATE[^_]*_/g, '')
      .replace(/__STRUCTURE[^_]*__/g, '')
      .replace(/__OPEN___/g, '')
      .replace(/__CLOSE__/g, '');
    
    // Ensure proper heading format
    if (line.match(/^#{1,6}\s/)) {
      // This is a heading - ensure proper spacing
      if (result.length > 0 && result[result.length - 1].trim() !== '') {
        result.push(''); // Add blank line before heading
      }
      result.push(line);
      result.push(''); // Add blank line after heading
    } else if (line.trim() === '') {
      // Only add empty line if the last line isn't already empty
      if (result.length > 0 && result[result.length - 1].trim() !== '') {
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }
  
  return result.join('\n')
    .replace(/\n{3,}/g, '\n\n') // Clean up excessive newlines
    .trim();
}

// 🔥 GEMINI TRANSLATION with perfect structure preservation
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
  
  // Clean input first
  const cleanedContent = cleanInputContent(content);
  
  const prompt = `You are a professional markdown translator. Your task is to translate the following markdown text to ${targetLanguageName}.

CRITICAL RULES:
1. Translate EVERY piece of text including all headings, subtitles, and content
2. Keep markdown formatting EXACTLY the same (# ## ### - * etc.)
3. Maintain the EXACT same structure and paragraph breaks
4. Do not add any extra text or artifacts
5. Do not use words like "TRANSLATE" in your output
6. For RTL languages like Hebrew/Arabic: translate the text content but keep markdown symbols in their original positions

Example of what I want:
Input:
## Section Title
Content paragraph.

Output should be:
## טיטל מתורגם
תוכן מתורגם.

Here is the markdown text to translate:

${cleanedContent}`;

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
        temperature: 0.1, // Very low for consistency
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Gemini translation failed');
  }

  const data = await response.json();
  let translatedText = data.candidates[0].content.parts[0].text;
  
  // Ensure perfect markdown structure
  translatedText = ensurePerfectMarkdown(translatedText);
  
  console.log('🌍 Gemini: Perfect markdown translation completed');
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
  
  // Clean input first
  const cleanedContent = cleanInputContent(content);

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
          content: `You are a professional markdown translator. Translate to ${targetLanguageName} while preserving EXACT markdown formatting. Translate ALL text including headings and content. Keep structure identical. Never add artifacts or extra text.`
        },
        {
          role: 'user',
          content: `Translate this markdown to ${targetLanguageName}:\n\n${cleanedContent}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'OpenAI translation failed');
  }

  const data = await response.json();
  let translatedText = data.choices[0].message.content;
  
  // Ensure perfect markdown structure
  translatedText = ensurePerfectMarkdown(translatedText);
  
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
  
  // Clean input first
  const cleanedContent = cleanInputContent(content);

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
      system: `You are a professional markdown translator. Translate to ${targetLanguageName} while preserving EXACT markdown formatting. Translate ALL text including headings and content. Keep structure identical. Never add artifacts or extra text.`,
      messages: [
        {
          role: 'user',
          content: `Translate this markdown to ${targetLanguageName}:\n\n${cleanedContent}`
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
  
  // Ensure perfect markdown structure
  translatedText = ensurePerfectMarkdown(translatedText);
  
  return translatedText;
}

async function translateWithGoogle(content: string, targetLanguage: string): Promise<string> {
  if (!googleApiKey) {
    throw new Error("Google API key not configured");
  }

  console.log('🌍 Google Translate: Processing markdown...');
  
  // Clean input first
  const cleanedContent = cleanInputContent(content);
  
  const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: cleanedContent,
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
  
  // Ensure perfect markdown structure
  translatedText = ensurePerfectMarkdown(translatedText);
  
  console.log('🌍 Google Translate: Markdown processing completed');
  return translatedText;
}

// Provider aliases
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

    const normalizedProvider = providerAliases[provider] || provider;

    console.log(`🔥 PERFECT TRANSLATOR: Translating to ${targetLanguage} using ${normalizedProvider}...`);
    console.log(`📝 Input structure preview: ${content.substring(0, 200)}...`);

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

    console.log("✅ Perfect markdown translation completed!");
    console.log(`📝 Output structure preview: ${translatedText.substring(0, 200)}...`);
    
    return new Response(JSON.stringify({ content: translatedText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in perfect translator function:", error);
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