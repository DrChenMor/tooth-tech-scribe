import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not set')
    }

    // Create personalized welcome email
    const displayName = name || email.split('@')[0]
    const welcomeSubject = `Welcome to DentAI, ${displayName}! 🦷`
    
    const welcomeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to DentAI</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f8fafc;
          }
          .container { 
            background: white; 
            border-radius: 12px; 
            padding: 40px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-bottom: 10px;
          }
          .tagline { 
            color: #6b7280; 
            font-size: 16px;
          }
          .welcome-text { 
            font-size: 18px; 
            margin-bottom: 20px; 
            color: #1f2937;
          }
          .features { 
            background: #f3f4f6; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
          }
          .feature { 
            margin: 10px 0; 
            padding-left: 20px; 
            position: relative;
          }
          .feature:before { 
            content: "✨"; 
            position: absolute; 
            left: 0;
          }
          .cta { 
            text-align: center; 
            margin: 30px 0;
          }
          .cta-button { 
            display: inline-block; 
            background: #1e40af; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .cta-button:hover { 
            background: #1e3a8a; 
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            color: #6b7280; 
            font-size: 14px;
          }
          .unsubscribe { 
            color: #9ca3af; 
            text-decoration: none; 
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">DentAI</div>
            <div class="tagline">Your AI-powered dental insights</div>
          </div>
          
          <div class="welcome-text">
            Hi ${displayName}! 👋
          </div>
          
          <p>
            Welcome to DentAI! We're excited to have you join our community of dental professionals and enthusiasts who are passionate about the future of AI in dentistry.
          </p>
          
          <div class="features">
            <h3 style="margin-top: 0; color: #1e40af;">What you'll receive:</h3>
            <div class="feature">Latest AI breakthroughs in dental technology</div>
            <div class="feature">Research insights and clinical applications</div>
            <div class="feature">Industry trends and expert analysis</div>
            <div class="feature">Practical tips for implementing AI in your practice</div>
          </div>
          
          <p>
            We'll send you our weekly newsletter every Tuesday, packed with the most relevant and actionable insights from the world of AI-powered dentistry.
          </p>
          
          <div class="cta">
            <a href="https://dentai.com/articles" class="cta-button">
              Explore Our Articles
            </a>
          </div>
          
          <div class="footer">
            <p>Thanks for subscribing!</p>
            <p>The DentAI Team</p>
            <br>
            <a href="https://dentai.com/unsubscribe?email=${encodeURIComponent(email)}" class="unsubscribe">
              Unsubscribe
            </a>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DentAI <onboarding@resend.dev>',
        to: email,
        subject: welcomeSubject,
        html: welcomeHtml,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text()
      console.error('Resend API error:', errorData)
      throw new Error(`Failed to send email: ${resendResponse.status}`)
    }

    const result = await resendResponse.json()
    console.log('Welcome email sent successfully:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        emailId: result.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending welcome email:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send welcome email',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 