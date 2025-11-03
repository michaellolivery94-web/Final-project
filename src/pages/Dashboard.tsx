import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { GapDetectorCard } from '@/components/GapDetectorCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Award, MessageCircle, Flame, Target, GraduationCap, ArrowRight } from 'lucide-react';

interface CompetencyProgress {
  topic: string;
  mastery: number;
}

export default function Dashboard() {
  const [competencies, setCompetencies] = useState<CompetencyProgress[]>([]);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { progress, syncProgress } = useProgress();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      syncProgress();
    }
  }, [user, syncProgress]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const { data: progressData } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (progressData?.competencies) {
        const competenciesObj = progressData.competencies as Record<string, number>;
        const competenciesArray: CompetencyProgress[] = Object.entries(competenciesObj).map(
          ([topic, mastery]) => ({
            topic,
            mastery: mastery as number,
          })
        );
        setCompetencies(competenciesArray.slice(0, 5));
      }

      const { data: chatData } = await supabase
        .from('chat_history')
        .select('subject')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (chatData) {
        const topics = chatData.map((c) => c.subject).filter((s, i, arr) => arr.indexOf(s) === i);
        setRecentTopics(topics);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const overallMastery =
    competencies.length > 0
      ? Math.round(competencies.reduce((sum, c) => sum + c.mastery, 0) / competencies.length)
      : 0;

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your streak today!';
    if (streak === 1) return 'Keep it up!';
    if (streak < 7) return 'Vizuri! Building momentum!';
    if (streak < 30) return 'Hongera! Great consistency!';
    return 'Nzuri sana! You\'re on fire!';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          Your CBC Learning Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track your progress in the Kenyan Competency-Based Curriculum! Hongera!
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
        <Card className="hover:shadow-lg transition-all hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Questions Asked</CardTitle>
            <MessageCircle className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{progress.questionsAsked}</div>
            <p className="text-xs text-muted-foreground mt-1">Keep asking! Curiosity is key!</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
            <Award className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{progress.lessonsCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">1 lesson = 5 questions</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
            <Flame className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{progress.learningStreak} days</div>
            <p className="text-xs text-muted-foreground mt-1">{getStreakMessage(progress.learningStreak)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 mb-6 sm:mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Current Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Grade Level</p>
              <p className="text-xl font-bold text-primary">{progress.grade}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subject</p>
              <p className="text-xl font-bold">{progress.subject}</p>
            </div>
            <Button
              onClick={() => navigate('/chat')}
              className="w-full mt-4"
              size="sm"
            >
              Continue Learning <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Competency Mastery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-2xl font-bold text-green-600">{overallMastery}%</span>
              </div>
              <Progress value={overallMastery} className="h-3" />
            </div>
            {competencies.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Recent Topics:</p>
                {competencies.slice(0, 3).map((comp, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="truncate">{comp.topic}</span>
                      <span className="font-medium ml-2">{comp.mastery}%</span>
                    </div>
                    <Progress value={comp.mastery} className="h-1.5" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Start learning to track your competencies!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gap Detector - Personalized Learning Insights */}
      <div className="mb-6 sm:mb-8">
        <GapDetectorCard />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Recent Learning Topics
          </CardTitle>
          <CardDescription>Subjects you've been exploring</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTopics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recentTopics.map((topic, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-colors"
                >
                  <p className="font-medium text-sm">{topic}</p>
                  <p className="text-xs text-muted-foreground mt-1">Recently studied</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground mb-4">
                No activity yet. Start your CBC learning journey today!
              </p>
              <Button onClick={() => navigate('/chat')} variant="default">
                Start Learning <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
