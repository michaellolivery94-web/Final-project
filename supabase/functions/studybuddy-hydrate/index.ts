import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startTime = performance.now();

    // Check hydration cache first for instant response
    const { data: cached } = await supabase
      .from("hydration_cache")
      .select("starter_activity_id, reason")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cached?.starter_activity_id) {
      const { data: cachedActivity } = await supabase
        .from("study_activities")
        .select("*")
        .eq("id", cached.starter_activity_id)
        .single();

      if (cachedActivity) {
        const latency = Math.round(performance.now() - startTime);
        console.log(`Hydrate cache hit: ${latency}ms for user ${user.id}`);

        // Update last_used_at
        await supabase
          .from("hydration_cache")
          .update({ last_used_at: new Date().toISOString() })
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({
            activity_id: cachedActivity.id,
            type: cachedActivity.activity_type,
            payload: {
              title: cachedActivity.title,
              description: cachedActivity.description,
              content: cachedActivity.content,
              skill_code: cachedActivity.skill_code,
            },
            estimated_time_sec: cachedActivity.estimated_time_sec,
            reason: cached.reason || "Quick win — continue your learning!",
            latency_ms: latency,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // No cache: find a good starter based on weak skills or recent activity
    const { data: skills } = await supabase
      .from("learner_skills")
      .select("skill_code, proficiency")
      .eq("user_id", user.id)
      .order("proficiency", { ascending: true })
      .limit(3);

    let activity;
    let reason = "Quick win — 45s";

    if (skills && skills.length > 0) {
      // Find activity for weakest skill
      const { data: activities } = await supabase
        .from("study_activities")
        .select("*")
        .eq("skill_code", skills[0].skill_code)
        .eq("locale", "ke")
        .order("difficulty", { ascending: true })
        .limit(1);

      if (activities && activities.length > 0) {
        activity = activities[0];
        reason = `Practice for your weak skill: ${skills[0].skill_code}`;
      }
    }

    // Fallback: random easy activity
    if (!activity) {
      const { data: activities } = await supabase
        .from("study_activities")
        .select("*")
        .eq("locale", "ke")
        .lte("difficulty", 0.5)
        .order("difficulty", { ascending: true })
        .limit(10);

      if (activities && activities.length > 0) {
        activity = activities[Math.floor(Math.random() * activities.length)];
        reason = "Quick win to get started!";
      }
    }

    if (!activity) {
      return new Response(JSON.stringify({ error: "No activities available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache this for next time
    await supabase.from("hydration_cache").upsert({
      user_id: user.id,
      starter_activity_id: activity.id,
      reason,
      cached_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
    });

    const latency = Math.round(performance.now() - startTime);
    console.log(`Hydrate generated: ${latency}ms for user ${user.id}`);

    return new Response(
      JSON.stringify({
        activity_id: activity.id,
        type: activity.activity_type,
        payload: {
          title: activity.title,
          description: activity.description,
          content: activity.content,
          skill_code: activity.skill_code,
        },
        estimated_time_sec: activity.estimated_time_sec,
        reason,
        latency_ms: latency,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Hydrate error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
