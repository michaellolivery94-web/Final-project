import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Adaptive proficiency update using exponential moving average
function updateProficiency(
  currentProficiency: number,
  score: number,
  difficulty: number
): number {
  const alpha = 0.3; // Learning rate
  const performanceSignal = score - difficulty;
  const newProficiency = currentProficiency + alpha * performanceSignal;
  return Math.max(0, Math.min(1, newProficiency));
}

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

    const body = await req.json();
    const { activity_id, score, time_spent_sec, metadata } = body;

    // Input validation
    if (!activity_id || typeof activity_id !== 'string') {
      return new Response(
        JSON.stringify({ error: "Activity ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(activity_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid activity ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (score === undefined || typeof score !== 'number') {
      return new Response(
        JSON.stringify({ error: "Score is required and must be a number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (score < 0 || score > 1) {
      return new Response(
        JSON.stringify({ error: "Score must be between 0 and 1" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!time_spent_sec || typeof time_spent_sec !== 'number') {
      return new Response(
        JSON.stringify({ error: "Time spent is required and must be a number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Number.isInteger(time_spent_sec) || time_spent_sec <= 0) {
      return new Response(
        JSON.stringify({ error: "Time spent must be a positive integer" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (time_spent_sec > 7200) {
      return new Response(
        JSON.stringify({ error: "Time spent cannot exceed 7200 seconds (2 hours)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (metadata !== undefined && (typeof metadata !== 'object' || Array.isArray(metadata))) {
      return new Response(
        JSON.stringify({ error: "Metadata must be an object if provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch activity details
    const { data: activity, error: activityError } = await supabase
      .from("study_activities")
      .select("*")
      .eq("id", activity_id)
      .single();

    if (activityError || !activity) {
      return new Response(JSON.stringify({ error: "Activity not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record activity completion
    const { error: reportError } = await supabase.from("activity_reports").insert({
      user_id: user.id,
      activity_id,
      score,
      time_spent_sec,
      metadata: metadata || {},
      completed_at: new Date().toISOString(),
    });

    if (reportError) {
      console.error("[INTERNAL] Report insert error:", { userId: user.id, error: reportError.message });
      return new Response(JSON.stringify({ error: "Failed to save progress. Please try again" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update skill proficiency
    const skillCode = activity.skill_code;
    const { data: existingSkill } = await supabase
      .from("learner_skills")
      .select("*")
      .eq("user_id", user.id)
      .eq("skill_code", skillCode)
      .single();

    const currentProf = existingSkill?.proficiency ?? 0.5;
    const newProf = updateProficiency(currentProf, score, activity.difficulty);

    if (existingSkill) {
      await supabase
        .from("learner_skills")
        .update({
          proficiency: newProf,
          last_practiced_at: new Date().toISOString(),
        })
        .eq("id", existingSkill.id);
    } else {
      await supabase.from("learner_skills").insert({
        user_id: user.id,
        skill_code: skillCode,
        proficiency: newProf,
        last_practiced_at: new Date().toISOString(),
      });
    }

    // Invalidate hydration cache to force refresh
    await supabase
      .from("hydration_cache")
      .delete()
      .eq("user_id", user.id);

    // Get next recommended activity
    const { data: skills } = await supabase
      .from("learner_skills")
      .select("skill_code, proficiency")
      .eq("user_id", user.id)
      .order("proficiency", { ascending: true })
      .limit(3);

    let nextActivity = null;
    if (skills && skills.length > 0) {
      const { data: activities } = await supabase
        .from("study_activities")
        .select("*")
        .eq("skill_code", skills[0].skill_code)
        .eq("locale", "ke")
        .gte("difficulty", skills[0].proficiency - 0.1)
        .lte("difficulty", skills[0].proficiency + 0.2)
        .limit(5);

      if (activities && activities.length > 0) {
        nextActivity = activities[Math.floor(Math.random() * activities.length)];
      }
    }

    console.log(`Report for ${user.id}: skill ${skillCode} updated to ${newProf.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        updated_skills: {
          skill_code: skillCode,
          old_proficiency: currentProf,
          new_proficiency: newProf,
        },
        next_activity: nextActivity
          ? {
              activity_id: nextActivity.id,
              title: nextActivity.title,
              description: nextActivity.description,
              estimated_time_sec: nextActivity.estimated_time_sec,
            }
          : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[INTERNAL] Report error:", { error: error instanceof Error ? error.message : "Unknown" });
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
