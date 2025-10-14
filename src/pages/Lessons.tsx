import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle2, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  category: string;
  duration_minutes: number;
}

interface UserProgress {
  lesson_id: string;
  completed: boolean;
}

export default function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchLessons();
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'Error loading lessons',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setLessons(data || []);
    }
    setLoading(false);
  };

  const fetchProgress = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_progress')
      .select('lesson_id, completed')
      .eq('user_id', user.id);

    setProgress(data || []);
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.some((p) => p.lesson_id === lessonId && p.completed);
  };

  const markAsComplete = async (lessonId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to track your progress',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      });

    if (error) {
      toast({
        title: 'Error saving progress',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Great job!',
        description: 'Lesson marked as complete',
      });
      fetchProgress();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-success text-success-foreground';
      case 'intermediate':
        return 'bg-accent text-accent-foreground';
      case 'advanced':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Learning Library</h1>
        <p className="text-muted-foreground">
          Explore our collection of lessons and start your learning journey
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => {
          const completed = isLessonCompleted(lesson.id);
          return (
            <Card
              key={lesson.id}
              className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => setSelectedLesson(lesson)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getDifficultyColor(lesson.difficulty)}>
                    {lesson.difficulty}
                  </Badge>
                  {completed && (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                </div>
                <CardTitle className="text-xl">{lesson.title}</CardTitle>
                <CardDescription>{lesson.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{lesson.duration_minutes} min</span>
                  </div>
                  <span className="font-medium">{lesson.category}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedLesson && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getDifficultyColor(selectedLesson.difficulty)}>
                    {selectedLesson.difficulty}
                  </Badge>
                  <Badge variant="outline">{selectedLesson.category}</Badge>
                </div>
                <DialogTitle className="text-2xl">{selectedLesson.title}</DialogTitle>
                <DialogDescription>{selectedLesson.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{selectedLesson.duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{selectedLesson.category}</span>
                  </div>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{selectedLesson.content}</p>
                </div>

                {user && !isLessonCompleted(selectedLesson.id) && (
                  <Button
                    onClick={() => markAsComplete(selectedLesson.id)}
                    className="w-full"
                  >
                    Mark as Complete
                  </Button>
                )}

                {user && isLessonCompleted(selectedLesson.id) && (
                  <div className="flex items-center justify-center gap-2 text-success p-4 bg-success/10 rounded-lg">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Completed!</span>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
