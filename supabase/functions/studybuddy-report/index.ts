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

    const { activity_id, score, time_spent_sec, metadata } = await req.json();

    if (!activity_id || score === undefined || !time_spent_sec) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: activity_id, score, time_spent_sec" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
      console.error("Report insert error:", reportError);
      return new Response(JSON.stringify({ error: "Failed to record activity" }), {
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
    console.error("Report error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
