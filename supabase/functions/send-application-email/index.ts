import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  status: 'accepted' | 'rejected';
  feedback: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, status, feedback }: EmailRequest = await req.json();

    console.log('Sending email to:', to, 'Status:', status);

    const subject = status === 'accepted' 
      ? "🎉 Your Internship Application Has Been Accepted!"
      : "Update on Your Internship Application";

    const message = status === 'accepted'
      ? `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">Congratulations!</h1>
          <p>We are pleased to inform you that your internship application has been <strong>accepted</strong>.</p>
          ${feedback ? `<div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #059669; margin: 20px 0;">
            <p style="margin: 0;"><strong>Message from Admin:</strong></p>
            <p style="margin: 10px 0 0 0;">${feedback}</p>
          </div>` : ''}
          <p>Please check your student portal for next steps.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>KLU Internship Management Team</strong></p>
        </div>`
      : `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Application Update</h1>
          <p>Thank you for your interest in our internship program.</p>
          <p>After careful consideration, we regret to inform you that your application was not selected at this time.</p>
          ${feedback ? `<div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid: #dc2626; margin: 20px 0;">
            <p style="margin: 0;"><strong>Feedback:</strong></p>
            <p style="margin: 10px 0 0 0;">${feedback}</p>
          </div>` : ''}
          <p>We encourage you to continue developing your skills and apply for future opportunities.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>KLU Internship Management Team</strong></p>
        </div>`;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "KLU Internship Portal <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: message,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(data.message || 'Failed to send email');
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-application-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
