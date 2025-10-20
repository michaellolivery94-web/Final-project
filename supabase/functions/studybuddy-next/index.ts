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

    // Get learner's skill proficiencies
    const { data: skills } = await supabase
      .from("learner_skills")
      .select("skill_code, proficiency, last_practiced_at")
      .eq("user_id", user.id)
      .order("proficiency", { ascending: true });

    let recommendedActivity;
    let why = "";

    // Strategy: Focus on weakest skills that haven't been practiced recently
    if (skills && skills.length > 0) {
      const weakestSkills = skills.slice(0, 3);
      
      for (const skill of weakestSkills) {
        const { data: activities } = await supabase
          .from("study_activities")
          .select("*")
          .eq("skill_code", skill.skill_code)
          .eq("locale", "ke")
          .gte("difficulty", skill.proficiency - 0.1)
          .lte("difficulty", skill.proficiency + 0.2)
          .limit(5);

        if (activities && activities.length > 0) {
          // Pick random from appropriate difficulty
          recommendedActivity = activities[Math.floor(Math.random() * activities.length)];
          why = `Focus on ${skill.skill_code} (${Math.round(skill.proficiency * 100)}% mastery). This activity matches your level.`;
          break;
        }
      }
    }

    // Fallback: Get recent activity type and suggest similar
    if (!recommendedActivity) {
      const { data: recentReports } = await supabase
        .from("activity_reports")
        .select("activity_id")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(1);

      if (recentReports && recentReports.length > 0) {
        const { data: lastActivity } = await supabase
          .from("study_activities")
          .select("skill_code")
          .eq("id", recentReports[0].activity_id)
          .single();
        
        const lastSkill = lastActivity?.skill_code;
        
        if (lastSkill) {
          const { data: activities } = await supabase
            .from("study_activities")
            .select("*")
            .eq("skill_code", lastSkill)
            .eq("locale", "ke")
            .limit(5);

          if (activities && activities.length > 0) {
            recommendedActivity = activities[Math.floor(Math.random() * activities.length)];
            why = `Continue practicing ${lastSkill}`;
          }
        }
      }
    }

    // Last resort: Random activity
    if (!recommendedActivity) {
      const { data: activities } = await supabase
        .from("study_activities")
        .select("*")
        .eq("locale", "ke")
        .limit(20);

      if (activities && activities.length > 0) {
        recommendedActivity = activities[Math.floor(Math.random() * activities.length)];
        why = "Try something new!";
      }
    }

    if (!recommendedActivity) {
      return new Response(JSON.stringify({ error: "No activities available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Next activity for ${user.id}: ${recommendedActivity.id}, reason: ${why}`);

    return new Response(
      JSON.stringify({
        activity_id: recommendedActivity.id,
        type: recommendedActivity.activity_type,
        payload: {
          title: recommendedActivity.title,
          description: recommendedActivity.description,
          content: recommendedActivity.content,
          skill_code: recommendedActivity.skill_code,
        },
        estimated_time_sec: recommendedActivity.estimated_time_sec,
        difficulty: recommendedActivity.difficulty,
        why,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Next activity error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
