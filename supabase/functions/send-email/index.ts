
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

console.log("send-email function booting");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body }: EmailRequest = await req.json();
    console.log(`Received request to send email to: ${to}`);

    if (!to || !subject || !body) {
      console.error("Request is missing required fields.");
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, or body" }),
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

    console.log(`📧 EMAIL LOGGED (Development Mode):`);
    console.log(`To: ${recipients.join(', ')}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log(`--- End Email ---`);

    // 🔥 TEMPORARY: Log email instead of sending (for development)
    // TODO: Set up Resend API key for production
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not set - logging email instead of sending");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email logged successfully (RESEND_API_KEY not configured)",
        logged: true
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If API key is set, use Resend
    const { Resend } = await import("npm:resend@2.0.0");
    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: "DentAI <onboarding@resend.dev>",
      to: recipients,
      subject: subject,
      html: body,
    });

    if (error) {
      console.error("Resend API error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Email sent successfully:", data);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unhandled error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An internal server error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
