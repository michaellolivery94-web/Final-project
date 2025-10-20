import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Trophy, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Activity {
  activity_id: string;
  type: string;
  payload: {
    title: string;
    description: string;
    content: any;
    skill_code: string;
  };
  estimated_time_sec: number;
  reason?: string;
  difficulty?: number;
  why?: string;
}

export const StudyBuddy = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Hydrate on mount - get instant starter activity
  useEffect(() => {
    if (!user) return;
    
    const fetchStarter = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("studybuddy-hydrate");
        
        if (error) throw error;
        
        setActivity(data);
        setStartTime(Date.now());
      } catch (err) {
        console.error("Hydrate error:", err);
        toast({
          variant: "destructive",
          title: "Connection issue",
          description: "Couldn't load your starter activity. Try again?",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStarter();
  }, [user, toast]);

  const handleSubmit = async () => {
    if (!activity || selectedAnswer === null) return;

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const content = activity.payload.content;
    const isCorrect = selectedAnswer === content.correct;
    const calculatedScore = isCorrect ? 1.0 : 0.0;

    setScore(calculatedScore);
    setShowFeedback(true);
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("studybuddy-report", {
        body: {
          activity_id: activity.activity_id,
          score: calculatedScore,
          time_spent_sec: timeSpent,
          metadata: { selected_answer: selectedAnswer },
        },
      });

      if (error) throw error;

      toast({
        title: isCorrect ? "Correct! 🎉" : "Keep learning! 💪",
        description: isCorrect
          ? `Great job! ${data.updated_skills?.skill_code} proficiency improved.`
          : content.explanation || "Try again next time!",
      });

      // Auto-load next activity after 3 seconds
      setTimeout(() => {
        if (data.next_activity) {
          setActivity({
            activity_id: data.next_activity.activity_id,
            type: "quiz",
            payload: {
              title: data.next_activity.title,
              description: data.next_activity.description,
              content: {},
              skill_code: "",
            },
            estimated_time_sec: data.next_activity.estimated_time_sec,
          });
          setSelectedAnswer(null);
          setShowFeedback(false);
          setScore(null);
          setStartTime(Date.now());
        }
      }, 3000);
    } catch (err) {
      console.error("Report error:", err);
      toast({
        variant: "destructive",
        title: "Couldn't save progress",
        description: "Your answer wasn't recorded. Try again?",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetNext = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("studybuddy-next");
      
      if (error) throw error;
      
      setActivity(data);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setScore(null);
      setStartTime(Date.now());
    } catch (err) {
      console.error("Next activity error:", err);
      toast({
        variant: "destructive",
        title: "Couldn't load next activity",
        description: "Try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Study Buddy
          </CardTitle>
          <CardDescription>Sign in to get personalized learning activities</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            Study Buddy
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!activity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Study Buddy
          </CardTitle>
          <CardDescription>No activities available right now</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGetNext} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const content = activity.payload.content;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">{activity.payload.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{activity.estimated_time_sec}s</span>
          </div>
        </div>
        <CardDescription>{activity.payload.description}</CardDescription>
        {(activity.reason || activity.why) && (
          <div className="mt-2 text-sm font-medium text-primary">
            Why this? — {activity.reason || activity.why}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {activity.type === "quiz" && content.question && (
          <>
            <div className="text-base font-medium">{content.question}</div>
            <div className="space-y-2">
              {content.options?.map((option: string, index: number) => (
                <Button
                  key={index}
                  variant={
                    showFeedback
                      ? index === content.correct
                        ? "default"
                        : index === selectedAnswer
                        ? "destructive"
                        : "outline"
                      : selectedAnswer === index
                      ? "secondary"
                      : "outline"
                  }
                  className="w-full justify-start text-left"
                  onClick={() => !showFeedback && setSelectedAnswer(index)}
                  disabled={showFeedback}
                >
                  {option}
                </Button>
              ))}
            </div>

            {showFeedback && content.explanation && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-1">Explanation:</p>
                <p className="text-sm">{content.explanation}</p>
              </div>
            )}

            {score !== null && (
              <div className="flex items-center gap-2">
                <Trophy className={`w-5 h-5 ${score === 1 ? "text-yellow-500" : "text-muted-foreground"}`} />
                <Progress value={score * 100} className="flex-1" />
              </div>
            )}

            <div className="flex gap-2">
              {!showFeedback ? (
                <Button
                  onClick={handleSubmit}
                  disabled={selectedAnswer === null || submitting}
                  className="flex-1"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Answer"}
                </Button>
              ) : (
                <Button onClick={handleGetNext} className="flex-1">
                  Next Activity
                </Button>
              )}
              <Button variant="outline" onClick={handleGetNext}>
                Skip
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
