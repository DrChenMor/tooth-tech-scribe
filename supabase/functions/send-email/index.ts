import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

console.log("Enhanced send-email function booting");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  // Additional fields that might come from workflow
  recipients?: string;
  message?: string;
  content?: string;
  email?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log("📨 Raw request body:", rawBody);
    
    let requestData: EmailRequest;
    try {
      requestData = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📨 Parsed request data:", JSON.stringify(requestData, null, 2));

    // Flexible field mapping for different data sources
    const to = requestData.to || requestData.recipients || requestData.email;
    const subject = requestData.subject;
    const body = requestData.body || requestData.message || requestData.content;

    console.log(`📧 Email details - To: ${to}, Subject: ${subject}, Body length: ${body?.length || 0}`);

    if (!to || !subject || !body) {
      const missingFields = [];
      if (!to) missingFields.push("to/recipients/email");
      if (!subject) missingFields.push("subject");
      if (!body) missingFields.push("body/message/content");
      
      console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return new Response(
        JSON.stringify({ 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          receivedFields: Object.keys(requestData),
          availableFields: ["to", "subject", "body", "recipients", "email", "message", "content"]
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipients = to.split(/[,;]/).map(email => email.trim()).filter(email => email);

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid recipients provided in the 'to' field." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for RESEND_API_KEY
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("⚠️ RESEND_API_KEY not set - logging email instead of sending");
      console.log(`📧 EMAIL LOGGED (Development Mode):`);
      console.log(`To: ${recipients.join(', ')}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      console.log(`--- End Email ---`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email logged successfully (RESEND_API_KEY not configured)",
        logged: true,
        recipients: recipients,
        subject: subject
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If API key is set, use Resend
    console.log("📤 Sending email via Resend API...");
    
    try {
      const { Resend } = await import("npm:resend@2.0.0");
      const resend = new Resend(resendApiKey);

      const { data, error } = await resend.emails.send({
        from: "DentAI <onboarding@resend.dev>", // 🔥 FIXED: Using Resend's default domain
        to: recipients,
        subject: subject,
        html: body,
      });

      if (error) {
        console.error("❌ Resend API error:", error);
        return new Response(JSON.stringify({ 
          error: error.message,
          type: "resend_api_error",
          details: error // Include more error details for debugging
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("✅ Email sent successfully:", data);
      return new Response(JSON.stringify({
        success: true,
        message: "Email sent successfully",
        data: data,
        recipients: recipients
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (importError) {
      console.error("❌ Failed to import Resend:", importError);
      return new Response(JSON.stringify({ 
        error: "Failed to load email service",
        details: importError.message,
        type: "import_error"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error("💥 Unhandled error in send-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An internal server error occurred.",
        type: "internal_error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});