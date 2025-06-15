
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

console.log("translator function booting");

const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
if (!googleApiKey) {
  console.error("GOOGLE_API_KEY is not set.");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TranslateRequest {
  content: string;
  targetLanguage: string;
  model: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, targetLanguage, model }: TranslateRequest = await req.json();

    if (!content || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: content or targetLanguage" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Translating to ${targetLanguage} using ${model || 'default'} model...`);

    const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: content,
        target: targetLanguage,
        format: 'html', // Preserves basic HTML formatting
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Translate API error response:", errorData);
      const errorMessage = errorData.error?.message || "Translation failed due to an API error.";
      throw new Error(errorMessage);
    }

    const result = await response.json();
    const translatedText = result.data.translations[0].translatedText;

    console.log("Translation successful.");
    return new Response(JSON.stringify({ content: translatedText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unhandled error in translator function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An internal server error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
