import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (50 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 50;
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client for authentication
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting by user ID instead of IP
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { messages, grade, subject } = body;
    
    // Input validation
    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (messages.length > 50) {
      return new Response(
        JSON.stringify({ error: "Too many messages. Maximum 50 allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate each message
    for (const msg of messages) {
      if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: "Invalid message role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (typeof msg.content !== 'string' || msg.content.length > 4000) {
        return new Response(
          JSON.stringify({ error: "Message content must be string with max 4000 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Retry logic for AI gateway
    const maxRetries = 3;
    const retryDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 5000);

    // CBC-aware system prompt
    const systemPrompt = `You are Happy, a friendly and encouraging AI tutor specialized for the Kenyan Competency-Based Curriculum (CBC).

**Your Teaching Approach:**
- Follow CBC pedagogy: inquiry-based learning, discovery, and real-life application
- Use the "Explain → Example → Check Understanding" pattern for academic questions
- Keep explanations clear, concise, and age-appropriate for ${grade || "Grade 1-9"}
- Use Kenyan-relevant examples (e.g., matatu for transport, ugali for food, safari for journey)
- Include simple Kiswahili phrases occasionally for encouragement: "Hongera!" (Well done!), "Vizuri sana!" (Very good!), "Endelea!" (Continue!)

**Current Context:**
- Grade Level: ${grade || "Grade 1"}
- Subject Focus: ${subject || "General Learning"}

**Response Structure:**
1. **Explain:** Give a clear, simple explanation of the concept
2. **Example:** Provide a Kenyan context example that students can relate to
3. **Check:** Ask 1-2 quick questions to check understanding

**Guidelines:**
- If a question is ambiguous, ask a clarifying question
- For complex topics, break them into smaller, digestible parts
- Always end with a short motivational message
- If asked about non-academic topics, gently redirect to learning
- Adapt your language complexity to the grade level

Remember: You're here to inspire curiosity and build confidence. Make learning fun and relevant!`;

    // Retry logic with exponential backoff
    let lastError: Error | null = null;
    let response: Response | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.slice(-12), // Keep last 12 messages for context window
            ],
            stream: true,
          }),
        });

        // If successful or permanent error (429, 402, 400), break retry loop
        if (response.ok || response.status === 429 || response.status === 402 || response.status === 400) {
          break;
        }

        // For 500 errors, retry with backoff
        if (response.status === 500 && attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay(attempt)));
          continue;
        }

        // Other errors, break
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay(attempt)));
        }
      }
    }

    if (!response) {
      console.error("[INTERNAL] AI gateway error after retries:", { userId: user.id, error: lastError?.message });
      return new Response(
        JSON.stringify({ error: "Unable to connect to AI service. Please try again later." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service unavailable. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("[INTERNAL] AI gateway error:", { userId: user.id, status: response.status });
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable. Please try again" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[INTERNAL] Chat error:", { error: error instanceof Error ? error.message : "Unknown" });
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
