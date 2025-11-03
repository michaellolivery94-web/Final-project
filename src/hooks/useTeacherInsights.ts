import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClassTopic {
  skill_code: string;
  skill_title: string;
  avg_proficiency: number;
  learner_count: number;
  min_proficiency: number;
  max_proficiency: number;
  status: 'critical' | 'needs_attention' | 'developing';
}

export interface TeacherInsights {
  low_proficiency_topics: ClassTopic[];
  total_learners: number;
  engagement_rate: number;
  activities_last_week: number;
  last_updated: string;
}

const getCachedInsights = (): TeacherInsights | null => {
  try {
    const cached = localStorage.getItem('teacher-insights-cache');
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    // Cache valid for 1 hour
    if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
      return parsed.data;
    }
  } catch {
    return null;
  }
  return null;
};

const setCachedInsights = (data: TeacherInsights) => {
  try {
    localStorage.setItem('teacher-insights-cache', JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to cache teacher insights:', e);
  }
};

export const useTeacherInsights = () => {
  const [insights, setInsights] = useState<TeacherInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!navigator.onLine) {
        const cached = getCachedInsights();
        if (cached) {
          setInsights(cached);
          setLoading(false);
          return;
        }
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('teacher-insights');

        if (fnError) throw fnError;
        
        setInsights(data);
        setCachedInsights(data);
        setError(null);
      } catch (err) {
        console.error('Teacher insights error:', err);
        setError('Failed to load class insights');
        
        // Fallback to cache
        const cached = getCachedInsights();
        if (cached) setInsights(cached);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return { insights, loading, error, refetch: () => {
    setLoading(true);
    setError(null);
  }};
};
