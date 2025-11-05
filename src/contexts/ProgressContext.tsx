import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface ProgressData {
  questionsAsked: number;
  lessonsCompleted: number;
  learningStreak: number;
  lastActiveDate: string | null;
  grade: string;
  subject: string;
  competencies: Record<string, number>;
}

interface ProgressContextType {
  progress: ProgressData;
  incrementQuestions: () => void;
  checkLessonCompletion: () => void;
  updateStreak: () => void;
  setGradeAndSubject: (grade: string, subject: string) => void;
  updateCompetency: (topic: string, mastery: number) => void;
  syncProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressData>({
    questionsAsked: 0,
    lessonsCompleted: 0,
    learningStreak: 0,
    lastActiveDate: null,
    grade: 'Grade 1',
    subject: 'General Learning',
    competencies: {},
  });

  const [syncTimer, setSyncTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      loadProgress();
      updateStreak();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (syncTimer) {
        clearTimeout(syncTimer);
      }
    };
  }, [syncTimer]);

  const loadProgress = async () => {
    if (!user) return;

    try {
      const { data: progressData } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (progressData) {
        const competenciesData = progressData.competencies as Record<string, number> || {};
        setProgress({
          questionsAsked: progressData.questions || 0,
          lessonsCompleted: progressData.lessons || 0,
          learningStreak: calculateStreak(progressData.last_active),
          lastActiveDate: progressData.last_active || null,
          grade: progressData.grade || 'Grade 1',
          subject: progressData.subject || 'General Learning',
          competencies: competenciesData,
        });
      } else {
        await supabase.from('progress').insert({
          user_id: user.id,
          grade: 'Grade 1',
          subject: 'General Learning',
          questions: 0,
          lessons: 0,
          streak: 0,
          last_active: new Date().toISOString().split('T')[0],
          competencies: {},
        });
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const calculateStreak = (lastActiveDate: string | null): number => {
    if (!lastActiveDate) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = new Date(lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return progress.learningStreak;
    } else if (diffDays === 1) {
      return progress.learningStreak + 1;
    }

    return 1;
  };

  const debouncedSync = useCallback(() => {
    if (syncTimer) {
      clearTimeout(syncTimer);
    }

    const timer = setTimeout(() => {
      syncProgress();
    }, 2000);

    setSyncTimer(timer);
  }, []);

  const incrementQuestions = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      questionsAsked: prev.questionsAsked + 1,
    }));
    debouncedSync();
  }, [debouncedSync]);

  const checkLessonCompletion = useCallback(() => {
    if ((progress.questionsAsked + 1) % 5 === 0) {
      setProgress(prev => ({
        ...prev,
        lessonsCompleted: prev.lessonsCompleted + 1,
      }));
      debouncedSync();
    }
  }, [progress.questionsAsked, debouncedSync]);

  const updateStreak = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    setProgress(prev => {
      const newStreak = calculateStreak(prev.lastActiveDate);
      return {
        ...prev,
        learningStreak: newStreak,
        lastActiveDate: today,
      };
    });
    debouncedSync();
  }, [user, debouncedSync]);

  const setGradeAndSubject = useCallback((grade: string, subject: string) => {
    setProgress(prev => ({
      ...prev,
      grade,
      subject,
    }));
    debouncedSync();
  }, [debouncedSync]);

  const updateCompetency = useCallback((topic: string, mastery: number) => {
    setProgress(prev => ({
      ...prev,
      competencies: {
        ...prev.competencies,
        [topic]: Math.max(prev.competencies[topic] || 0, mastery),
      },
    }));
    debouncedSync();
  }, [debouncedSync]);

  const syncProgress = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('progress')
        .upsert(
          {
            user_id: user.id,
            grade: progress.grade,
            subject: progress.subject,
            questions: progress.questionsAsked,
            lessons: progress.lessonsCompleted,
            streak: progress.learningStreak,
            last_active: progress.lastActiveDate || new Date().toISOString().split('T')[0],
            competencies: progress.competencies,
          },
          { onConflict: 'user_id' }
        );
    } catch (error) {
      console.error('Error syncing progress:', error);
    }
  }, [user, progress]);

  return (
    <ProgressContext.Provider
      value={{
        progress,
        incrementQuestions,
        checkLessonCompletion,
        updateStreak,
        setGradeAndSubject,
        updateCompetency,
        syncProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
