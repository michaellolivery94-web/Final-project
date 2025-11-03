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

    // Verify teacher/admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["teacher", "admin"]);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Teacher access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get low proficiency topics across all students
    const { data: lowProficiencyData, error: profError } = await supabase
      .from("class_proficiency_summary")
      .select("*")
      .order("avg_proficiency", { ascending: true })
      .limit(10);

    if (profError) {
      console.error("[INTERNAL] Proficiency query error:", profError);
      return new Response(JSON.stringify({ error: "Failed to fetch class data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get total learners count
    const { count: totalLearners } = await supabase
      .from("learner_skills")
      .select("user_id", { count: "exact", head: true });

    // Get recent activity stats
    const { data: recentActivity } = await supabase
      .from("activity_reports")
      .select("completed_at")
      .gte("completed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("completed_at", { ascending: false });

    // Format topics with actionable insights
    const formattedTopics = lowProficiencyData?.map((topic) => ({
      skill_code: topic.skill_code,
      skill_title: topic.skill_title || topic.skill_code,
      avg_proficiency: Math.round((topic.avg_proficiency || 0) * 100),
      learner_count: topic.learner_count || 0,
      min_proficiency: Math.round((topic.min_proficiency || 0) * 100),
      max_proficiency: Math.round((topic.max_proficiency || 0) * 100),
      status: (topic.avg_proficiency || 0) < 0.5 ? "critical" : (topic.avg_proficiency || 0) < 0.7 ? "needs_attention" : "developing",
    })) || [];

    // Calculate engagement rate
    const engagementRate = totalLearners && recentActivity
      ? Math.min(100, Math.round((recentActivity.length / (totalLearners * 7)) * 100))
      : 0;

    console.log(`Teacher insights: ${formattedTopics.length} topics, ${totalLearners} learners`);

    return new Response(
      JSON.stringify({
        low_proficiency_topics: formattedTopics,
        total_learners: totalLearners || 0,
        engagement_rate: engagementRate,
        activities_last_week: recentActivity?.length || 0,
        last_updated: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[INTERNAL] Teacher insights error:", error instanceof Error ? error.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
