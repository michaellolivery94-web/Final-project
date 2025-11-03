import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MASTERY_THRESHOLD = 0.70; // 70% proficiency threshold

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

    // Allow teachers to check specific student or default to self
    const url = new URL(req.url);
    const learnerId = url.searchParams.get("learner_id") || user.id;

    // Verify teacher permission if checking another user
    if (learnerId !== user.id) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["teacher", "admin"]);
      
      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get learner's skill proficiencies
    const { data: skills, error: skillsError } = await supabase
      .from("learner_skills")
      .select(`
        skill_code,
        proficiency,
        last_practiced_at,
        study_activities(title, description)
      `)
      .eq("user_id", learnerId)
      .order("proficiency", { ascending: true });

    if (skillsError) {
      console.error("[INTERNAL] Skills query error:", skillsError);
      return new Response(JSON.stringify({ error: "Failed to fetch learner data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!skills || skills.length === 0) {
      return new Response(
        JSON.stringify({
          learner_id: learnerId,
          message: "No performance data yet. Complete some activities to get started!",
          low_proficiency_topics: [],
          overall_mastery: "Not assessed",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Identify weak topics below mastery threshold
    const lowProficiencyTopics = skills
      .filter((s) => s.proficiency < MASTERY_THRESHOLD)
      .slice(0, 5) // Top 5 weakest
      .map((s) => {
        const title = s.study_activities?.[0]?.title || s.skill_code;
        const scorePercent = Math.round(s.proficiency * 100);
        
        // Contextual CBC recommendations
        let recommendation = "";
        if (scorePercent < 40) {
          recommendation = `Foundational review needed. Start with visual aids and basic drills for ${title}.`;
        } else if (scorePercent < 60) {
          recommendation = `Practice core concepts using local examples. Work through guided exercises for ${title}.`;
        } else {
          recommendation = `Nearly there! Focus on edge cases and application problems for ${title}.`;
        }

        return {
          topic: title,
          skill_code: s.skill_code,
          score: scorePercent,
          last_practiced: s.last_practiced_at,
          recommendation,
        };
      });

    // Calculate overall mastery
    const avgProficiency = skills.reduce((sum, s) => sum + s.proficiency, 0) / skills.length;
    let overallMastery = "Developing";
    if (avgProficiency >= 0.85) overallMastery = "Excellent";
    else if (avgProficiency >= 0.70) overallMastery = "Good";
    else if (avgProficiency >= 0.50) overallMastery = "Moderate";

    console.log(`Gap analysis for ${learnerId}: ${lowProficiencyTopics.length} weak topics found`);

    return new Response(
      JSON.stringify({
        learner_id: learnerId,
        low_proficiency_topics: lowProficiencyTopics,
        overall_mastery: overallMastery,
        avg_proficiency_percent: Math.round(avgProficiency * 100),
        total_skills_tracked: skills.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[INTERNAL] Gap detector error:", error instanceof Error ? error.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
