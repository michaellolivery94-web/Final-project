import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Trophy, Clock, Volume2, WifiOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useActivityCache } from "@/hooks/useActivityCache";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { speak, stop, isSpeaking } = useVoiceOutput();
  const { isOnline, queueLength, addToQueue } = useOfflineSync();
  const { cacheActivity, getRandomCached, hasCachedActivities } = useActivityCache();
  const { voiceEnabled } = useAccessibility();
  const { t } = useLanguage();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Hydrate on mount - with offline fallback
  useEffect(() => {
    if (!user) return;
    
    const fetchStarter = async () => {
      setLoading(true);
      try {
        if (!isOnline) {
          // Use cached activity if offline
          const cached = getRandomCached();
          if (cached) {
            setActivity(cached);
            setStartTime(Date.now());
            toast({
              title: t('offline'),
              description: t('offlineMessage'),
            });
          }
          return;
        }

        const { data, error } = await supabase.functions.invoke("studybuddy-hydrate");
        
        if (error) throw error;
        
        setActivity(data);
        cacheActivity(data);
        setStartTime(Date.now());
      } catch (err) {
        console.error("Hydrate error:", err);
        
        // Fallback to cache on error
        const cached = getRandomCached();
        if (cached) {
          setActivity(cached);
          setStartTime(Date.now());
          toast({
            title: "Using cached activity",
            description: "Couldn't reach server, showing saved content",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Connection issue",
            description: "No cached activities available. Connect to internet.",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStarter();
  }, [user, toast, isOnline]);

  const handleSubmit = async () => {
    if (!activity || selectedAnswer === null) return;

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const content = activity.payload.content;
    const isCorrect = selectedAnswer === content.correct;
    const calculatedScore = isCorrect ? 1.0 : 0.0;

    setScore(calculatedScore);
    setShowFeedback(true);
    setSubmitting(true);

    // Voice feedback
    if (voiceEnabled) {
      const feedbackText = isCorrect 
        ? `${t('correct')} ${content.explanation || ''}`
        : `${t('keepLearning')} ${content.explanation || ''}`;
      speak(feedbackText);
    }

    const reportData = {
      activity_id: activity.activity_id,
      score: calculatedScore,
      time_spent_sec: timeSpent,
      metadata: { selected_answer: selectedAnswer },
    };

    try {
      if (!isOnline) {
        // Queue for later sync
        addToQueue(reportData);
        toast({
          title: isCorrect ? t('correct') : t('keepLearning'),
          description: "Progress saved locally - will sync when online",
        });
        
        // Load cached next activity
        setTimeout(() => {
          const cached = getRandomCached();
          if (cached) {
            setActivity(cached);
            setSelectedAnswer(null);
            setShowFeedback(false);
            setScore(null);
            setStartTime(Date.now());
          }
        }, 3000);
        return;
      }

      const { data, error } = await supabase.functions.invoke("studybuddy-report", {
        body: reportData,
      });

      if (error) throw error;

      toast({
        title: isCorrect ? t('correct') : t('keepLearning'),
        description: isCorrect
          ? `Great job! ${data.updated_skills?.skill_code} proficiency improved.`
          : content.explanation || "Try again next time!",
      });

      // Auto-load next activity after 3 seconds
      setTimeout(() => {
        if (data.next_activity) {
          const nextActivity = {
            activity_id: data.next_activity.activity_id,
            type: "quiz",
            payload: {
              title: data.next_activity.title,
              description: data.next_activity.description,
              content: data.next_activity.content || {},
              skill_code: data.next_activity.skill_code || "",
            },
            estimated_time_sec: data.next_activity.estimated_time_sec,
          };
          setActivity(nextActivity);
          cacheActivity(nextActivity);
          setSelectedAnswer(null);
          setShowFeedback(false);
          setScore(null);
          setStartTime(Date.now());
        }
      }, 3000);
    } catch (err) {
      console.error("Report error:", err);
      addToQueue(reportData);
      toast({
        title: "Saved locally",
        description: "Will sync when connection improves",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetNext = async () => {
    setLoading(true);
    try {
      if (!isOnline) {
        const cached = getRandomCached();
        if (cached) {
          setActivity(cached);
          setSelectedAnswer(null);
          setShowFeedback(false);
          setScore(null);
          setStartTime(Date.now());
        }
        return;
      }

      const { data, error } = await supabase.functions.invoke("studybuddy-next");
      
      if (error) throw error;
      
      setActivity(data);
      cacheActivity(data);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setScore(null);
      setStartTime(Date.now());
    } catch (err) {
      console.error("Next activity error:", err);
      const cached = getRandomCached();
      if (cached) {
        setActivity(cached);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setScore(null);
        setStartTime(Date.now());
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't load next activity",
          description: "No cached content available",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = () => {
    if (!activity) return;
    const content = activity.payload.content;
    if (isSpeaking) {
      stop();
    } else {
      const text = `${activity.payload.title}. ${content.question}`;
      speak(text);
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
            {t('studyBuddy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
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
          <div className="flex items-center gap-2">
            {!isOnline && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </div>
            )}
            {queueLength > 0 && (
              <div className="text-xs text-muted-foreground">
                {queueLength} pending
              </div>
            )}
            {voiceEnabled && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSpeak}
                className="h-8 w-8"
              >
                <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
              </Button>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{activity.estimated_time_sec}s</span>
            </div>
          </div>
        </div>
        <CardDescription>{activity.payload.description}</CardDescription>
        {(activity.reason || activity.why) && (
          <div className="mt-2 text-sm font-medium text-primary">
            {t('whyThis')} — {activity.reason || activity.why}
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
                <p className="text-sm font-medium mb-1">{t('explanation')}</p>
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('submitAnswer')}
                </Button>
              ) : (
                <Button onClick={handleGetNext} className="flex-1">
                  {t('nextActivity')}
                </Button>
              )}
              <Button variant="outline" onClick={handleGetNext}>
                {t('skip')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
