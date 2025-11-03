import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, BookOpen } from "lucide-react";
import { useGapDetector } from "@/hooks/useGapDetector";

export const GapDetectorCard = () => {
  const { analysis, loading, error } = useGapDetector();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Analysis
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!analysis || analysis.message) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Your Learning Gaps
          </CardTitle>
          <CardDescription>
            {analysis?.message || "Complete some activities to see personalized recommendations!"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Your Learning Gaps
        </CardTitle>
        <CardDescription>
          Overall Mastery: <Badge variant="secondary">{analysis.overall_mastery}</Badge> ({analysis.avg_proficiency_percent}%)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {analysis.low_proficiency_topics.length === 0 ? (
          <p className="text-sm text-muted-foreground">Great work! No weak areas detected. Keep it up!</p>
        ) : (
          analysis.low_proficiency_topics.map((topic) => (
            <div key={topic.skill_code} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{topic.topic}</h4>
                  <p className="text-sm text-muted-foreground">Current Score: {topic.score}%</p>
                </div>
                <Badge variant={topic.score < 40 ? "destructive" : topic.score < 60 ? "secondary" : "outline"}>
                  {topic.score < 40 ? "Needs Focus" : topic.score < 60 ? "Practice More" : "Almost There"}
                </Badge>
              </div>
              <p className="text-sm bg-muted p-3 rounded">
                💡 {topic.recommendation}
              </p>
            </div>
          ))
        )}
        {!navigator.onLine && (
          <p className="text-xs text-muted-foreground mt-4">
            📴 Offline mode - showing last synced data
          </p>
        )}
      </CardContent>
    </Card>
  );
};
