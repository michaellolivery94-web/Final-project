import { useState, useEffect, useCallback } from 'react';

interface Activity {
  activity_id: string;
  type: string;
  payload: any;
  estimated_time_sec: number;
  reason?: string;
  difficulty?: number;
  why?: string;
}

const CACHE_KEY = 'happy-learn-activities';
const CACHE_EXPIRY_DAYS = 3;

export const useActivityCache = () => {
  const [cachedActivities, setCachedActivities] = useState<Activity[]>([]);

  useEffect(() => {
    loadCache();
  }, []);

  const loadCache = () => {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        const expiryDate = new Date(parsed.timestamp + CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        
        if (new Date() < expiryDate) {
          setCachedActivities(parsed.activities || []);
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (err) {
      console.error('Failed to load activity cache:', err);
    }
  };

  const cacheActivity = useCallback((activity: Activity) => {
    try {
      const current = cachedActivities;
      const updated = [activity, ...current].slice(0, 20); // Keep last 20
      
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        activities: updated,
        timestamp: Date.now(),
      }));
      
      setCachedActivities(updated);
    } catch (err) {
      console.error('Failed to cache activity:', err);
    }
  }, [cachedActivities]);

  const getRandomCached = useCallback((): Activity | null => {
    if (cachedActivities.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * cachedActivities.length);
    return cachedActivities[randomIndex];
  }, [cachedActivities]);

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    setCachedActivities([]);
  };

  return {
    cachedActivities,
    cacheActivity,
    getRandomCached,
    clearCache,
    hasCachedActivities: cachedActivities.length > 0,
  };
};
