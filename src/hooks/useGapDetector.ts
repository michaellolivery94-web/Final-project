import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GapTopic {
  topic: string;
  skill_code: string;
  score: number;
  last_practiced: string;
  recommendation: string;
}

export interface GapAnalysis {
  learner_id: string;
  low_proficiency_topics: GapTopic[];
  overall_mastery: string;
  avg_proficiency_percent: number;
  total_skills_tracked: number;
  message?: string;
}

// Prevents stale data if learner goes offline mid-fetch
const getCachedGaps = (): GapAnalysis | null => {
  try {
    const cached = localStorage.getItem('gap-detector-cache');
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    // Cache valid for 24 hours
    if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
      return parsed.data;
    }
  } catch {
    return null;
  }
  return null;
};

const setCachedGaps = (data: GapAnalysis) => {
  try {
    localStorage.setItem('gap-detector-cache', JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to cache gap analysis:', e);
  }
};

export const useGapDetector = (learnerId?: string) => {
  const [analysis, setAnalysis] = useState<GapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGaps = async () => {
      if (!navigator.onLine) {
        const cached = getCachedGaps();
        if (cached) {
          setAnalysis(cached);
          setLoading(false);
          return;
        }
      }

      try {
        const params = learnerId ? `?learner_id=${learnerId}` : '';
        const { data, error: fnError } = await supabase.functions.invoke('gap-detector', {
          body: {},
        });

        if (fnError) throw fnError;
        
        setAnalysis(data);
        setCachedGaps(data);
        setError(null);
      } catch (err) {
        console.error('Gap detector error:', err);
        setError('Failed to load gap analysis');
        
        // Fallback to cache on error
        const cached = getCachedGaps();
        if (cached) setAnalysis(cached);
      } finally {
        setLoading(false);
      }
    };

    fetchGaps();
  }, [learnerId]);

  return { analysis, loading, error };
};
