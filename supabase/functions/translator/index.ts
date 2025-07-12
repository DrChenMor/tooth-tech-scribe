// FIXED supabase/functions/translator/index.ts
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

// 🔥 ENHANCED: Better markdown structure preservation
function protectMarkdownFormatting(content: string): { 
  protected: string; 
  placeholders: Map<string, string> 
} {
  const placeholders = new Map<string, string>();
  let protectedContent = content;
  let placeholderCounter = 0;

  // Function to create a unique placeholder
  const createPlaceholder = (type: string) => {
    const placeholder = `___MDPROTECT_${type}_${placeholderCounter++}___`;
    return placeholder;
  };

  // 🔥 CRITICAL: Protect code blocks first (they contain other markdown)
  protectedContent = protectedContent.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = createPlaceholder('CODEBLOCK');
    placeholders.set(placeholder, match);
    return placeholder;
  });

  // Protect inline code
  protectedContent = protectedContent.replace(/`([^`]+)`/g, (match) => {
    const placeholder = createPlaceholder('INLINECODE');
    placeholders.set(placeholder, match);
    return placeholder;
  });

  // Protect headings with their structure
  protectedContent = protectedContent.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, title) => {
    const placeholder = createPlaceholder('HEADING');
    placeholders.set(placeholder, match);
    return `${hashes} ___TRANSLATE_${placeholder}___ `;
  });

  // Protect bullet points structure
  protectedContent = protectedContent.replace(/^(\s*)([-*+])\s+(.+)$/gm, (match, indent, bullet, content) => {
    const placeholder = createPlaceholder('BULLET');
    placeholders.set(placeholder, `${indent}${bullet} `);
    return `___STRUCTURE_${placeholder}___${content}`;
  });

  // Protect numbered lists structure
  protectedContent = protectedContent.replace(/^(\s*)(\d+\.)\s+(.+)$/gm, (match, indent, number, content) => {
    const placeholder = createPlaceholder('NUMBER');
    placeholders.set(placeholder, `${indent}${number} `);
    return `___STRUCTURE_${placeholder}___${content}`;
  });

  // Protect links
  protectedContent = protectedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match) => {
    const placeholder = createPlaceholder('LINK');
    placeholders.set(placeholder, match);
    return placeholder;
  });

  // Protect bold/italic formatting
  protectedContent = protectedContent.replace(/\*\*([^*]+)\*\*/g, (match, content) => {
    const placeholder = createPlaceholder('BOLD');
    placeholders.set(placeholder, '**');
    return `___OPEN_${placeholder}___${content}___CLOSE_${placeholder}___`;
  });

  protectedContent = protectedContent.replace(/\*([^*]+)\*/g, (match, content) => {
    const placeholder = createPlaceholder('ITALIC');
    placeholders.set(placeholder, '*');
    return `___OPEN_${placeholder}___${content}___CLOSE_${placeholder}___`;
  });

  return { protected: protectedContent, placeholders };
}

function restoreMarkdownFormatting(content: string, placeholders: Map<string, string>): string {
  let restoredContent = content;

  // Restore structure placeholders
  for (const [placeholder, original] of placeholders.entries()) {
    if (placeholder.includes('STRUCTURE_')) {
      restoredContent = restoredContent.replace(`___STRUCTURE_${placeholder}___`, original);
    }
  }

  // Restore translation placeholders for headings
  for (const [placeholder, original] of placeholders.entries()) {
    if (placeholder.includes('TRANSLATE_')) {
      restoredContent = restoredContent.replace(`___TRANSLATE_${placeholder}___`, '');
      // The heading structure is already preserved
    }
  }

  // Restore formatting
  for (const [placeholder, original] of placeholders.entries()) {
    if (placeholder.includes('OPEN_') || placeholder.includes('CLOSE_')) {
      const baseId = placeholder.replace('___OPEN_', '').replace('___CLOSE_', '').replace('___', '');
      if (placeholders.has(baseId)) {
        const formatChar = placeholders.get(baseId);
        restoredContent = restoredContent.replace(`___OPEN_${placeholder}___`, formatChar || '');
        restoredContent = restoredContent.replace(`___CLOSE_${placeholder}___`, formatChar || '');
      }
    }
  }

  // Restore protected elements
  for (const [placeholder, original] of placeholders.entries()) {
    if (!placeholder.includes('STRUCTURE_') && !placeholder.includes('TRANSLATE_') && 
        !placeholder.includes('OPEN_') && !placeholder.includes('CLOSE_')) {
      restoredContent = restoredContent.replace(new RegExp(placeholder, 'g'), original);
    }
  }

  return restoredContent;
}

function fixTextStructure(content: string, targetLanguage: string): string {
  console.log('🔧 Fixing text structure for language:', targetLanguage);
  
  let fixedContent = content;
  
  // 🔥 CRITICAL: Ensure proper paragraph separation
  const paragraphs = fixedContent.split(/\n\s*\n/);
  const cleanParagraphs = paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => {
      // Ensure headings are on their own lines
      p = p.replace(/^(#{1,6}\s+)/gm, '\n$1').trim();
      
      // Ensure bullet points are properly spaced
      p = p.replace(/^(\s*[-*+]\s+)/gm, '\n$1').trim();
      
      // Ensure numbered lists are properly spaced
      p = p.replace(/^(\s*\d+\.\s+)/gm, '\n$1').trim();
      
      return p;
    });
  
  fixedContent = cleanParagraphs.join('\n\n');
  
  // 🔥 RTL-specific fixes for Hebrew, Arabic, etc.
  const rtlLanguages = ['he', 'ar', 'fa', 'ur'];
  if (rtlLanguages.includes(targetLanguage)) {
    console.log('🔧 Applying RTL-specific fixes...');
    
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
    .replace(/^((?:\s*[-*+]\s+.*?\n)+)\n*([^-*+\s#])/gm, '$1\n$2')
    .trim();
  
  console.log('🔧 Text structure fixed');
  return fixedContent;
}

// Enhanced AI translation functions with better structure preservation
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
  
  // 🔥 ENHANCED: Protection and restoration system
  const { protected: protectedContent, placeholders } = protectMarkdownFormatting(content);
  
  const prompt = `You are a professional translator specializing in preserving document structure and formatting.

CRITICAL INSTRUCTIONS:
1. Translate the following text to ${targetLanguageName}
2. PRESERVE ALL markdown formatting EXACTLY (##, ###, *, -, etc.)
3. MAINTAIN paragraph breaks and structure EXACTLY
4. Keep all headings, bullet points, and numbered lists intact
5. For RTL languages like Hebrew/Arabic, ensure proper text direction but keep markdown syntax
6. DO NOT merge paragraphs - keep each paragraph separate
7. DO NOT translate any placeholder text that looks like ___MDPROTECT_XXX___ - keep these EXACTLY as they are
8. Maintain the EXACT document structure

Text to translate:
${protectedContent}

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
  
  // 🔥 CRITICAL: Restore markdown formatting
  const restoredText = restoreMarkdownFormatting(translatedText, placeholders);
  const structuredText = fixTextStructure(restoredText, targetLanguage);
  
  console.log('🌍 Gemini: Translation completed with enhanced structure preservation');
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

  // 🔥 ENHANCED: Protection and restoration system
  const { protected: protectedContent, placeholders } = protectMarkdownFormatting(content);

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
          content: `You are a professional translator. Translate to ${targetLanguageName} while PERFECTLY preserving all markdown formatting, paragraph breaks, headings (##, ###), bullet points, and document structure. For RTL languages, maintain proper text direction but keep all markdown syntax intact. DO NOT merge paragraphs. DO NOT translate placeholder text that looks like ___MDPROTECT_XXX___ - keep these EXACTLY as they are.`
        },
        {
          role: 'user',
          content: protectedContent
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
  
  // 🔥 CRITICAL: Restore markdown formatting
  const restoredText = restoreMarkdownFormatting(translatedText, placeholders);
  const structuredText = fixTextStructure(restoredText, targetLanguage);
  
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

  // 🔥 ENHANCED: Protection and restoration system
  const { protected: protectedContent, placeholders } = protectMarkdownFormatting(content);

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
      system: `You are a professional translator. Translate to ${targetLanguageName} while PERFECTLY preserving all markdown formatting, paragraph breaks, headings (##, ###), bullet points, and document structure. For RTL languages, maintain proper text direction but keep all markdown syntax intact. DO NOT merge paragraphs. DO NOT translate placeholder text that looks like ___MDPROTECT_XXX___ - keep these EXACTLY as they are.`,
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
  const translatedText = data.content[0].text;
  
  // 🔥 CRITICAL: Restore markdown formatting
  const restoredText = restoreMarkdownFormatting(translatedText, placeholders);
  const structuredText = fixTextStructure(restoredText, targetLanguage);
  
  return structuredText;
}

async function translateWithGoogle(content: string, targetLanguage: string): Promise<string> {
  if (!googleApiKey) {
    throw new Error("Google API key not configured");
  }

  console.log('🌍 Google Translate: Using advanced structure preservation...');
  
  // 🔥 ENHANCED: Protection and restoration system
  const { protected: protectedContent, placeholders } = protectMarkdownFormatting(content);
  
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
  
  // 🔥 CRITICAL: Restore markdown formatting
  const restoredText = restoreMarkdownFormatting(translatedText, placeholders);
  const structuredText = fixTextStructure(restoredText, targetLanguage);
  
  console.log('🌍 Google Translate: Enhanced structure preservation completed');
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

    console.log(`🔥 ENHANCED TRANSLATOR: Translating to ${targetLanguage} using ${normalizedProvider}...`);
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

    console.log("✅ Enhanced translation successful with structure preservation.");
    console.log(`📝 Translated preview: ${translatedText.substring(0, 200)}...`);
    
    return new Response(JSON.stringify({ content: translatedText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unhandled error in enhanced translator function:", error);
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