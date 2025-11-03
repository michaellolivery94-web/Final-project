import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProficiencyChart } from "@/components/ProficiencyChart";
import { useTeacherInsights } from "@/hooks/useTeacherInsights";
import { Users, Activity, TrendingDown, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { insights, loading, error } = useTeacherInsights();

  useEffect(() => {
    const checkTeacherAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["teacher", "admin"]);

      if (!roles || roles.length === 0) {
        toast({
          title: "Access Denied",
          description: "Teacher access required",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    checkTeacherAccess();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
            <CardDescription>{error || "Failed to load teacher insights"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Class-wide learning analytics for CBC-aligned education
        </p>
        {!navigator.onLine && (
          <Badge variant="secondary" className="mt-2">
            📴 Offline Mode - Last updated: {new Date(insights.last_updated).toLocaleString()}
          </Badge>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Learners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.total_learners}</div>
            <p className="text-xs text-muted-foreground mt-1">Actively tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.engagement_rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {insights.activities_last_week} activities this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Topics Needing Focus</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.low_proficiency_topics.filter(t => t.status === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Below 50% proficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Proficiency Chart */}
      {insights.low_proficiency_topics.length > 0 && (
        <ProficiencyChart topics={insights.low_proficiency_topics} />
      )}

      {/* Topic Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Topic Analysis</CardTitle>
          <CardDescription>Class-wide proficiency breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {insights.low_proficiency_topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No low proficiency topics detected. Great work!
            </p>
          ) : (
            <div className="space-y-3">
              {insights.low_proficiency_topics.map((topic) => (
                <div key={topic.skill_code} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{topic.skill_title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {topic.learner_count} learners • Avg: {topic.avg_proficiency}%
                      </p>
                    </div>
                    <Badge
                      variant={
                        topic.status === 'critical'
                          ? 'destructive'
                          : topic.status === 'needs_attention'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {topic.status === 'critical'
                        ? 'Critical'
                        : topic.status === 'needs_attention'
                        ? 'Needs Attention'
                        : 'Developing'}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Min: {topic.min_proficiency}%</span>
                    <span>Max: {topic.max_proficiency}%</span>
                    <span>Range: {topic.max_proficiency - topic.min_proficiency}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
