import { useState, useEffect, useCallback } from 'react';

const FREE_DAILY_LIMIT = 5;
const STORAGE_KEY = 'happy_learn_daily_questions';

interface DailyUsage {
  date: string;
  count: number;
}

export function useDailyQuestionLimit(isPremium: boolean) {
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [canAskQuestion, setCanAskQuestion] = useState(true);

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const getStoredUsage = useCallback((): DailyUsage => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const usage: DailyUsage = JSON.parse(stored);
        // Reset if it's a new day
        if (usage.date !== getTodayString()) {
          return { date: getTodayString(), count: 0 };
        }
        return usage;
      }
    } catch (e) {
      console.error('Error reading daily usage:', e);
    }
    return { date: getTodayString(), count: 0 };
  }, []);

  const saveUsage = useCallback((count: number) => {
    const usage: DailyUsage = { date: getTodayString(), count };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  }, []);

  // Load usage on mount and when premium status changes
  useEffect(() => {
    const usage = getStoredUsage();
    setQuestionsUsed(usage.count);
    setCanAskQuestion(isPremium || usage.count < FREE_DAILY_LIMIT);
  }, [isPremium, getStoredUsage]);

  const incrementUsage = useCallback(() => {
    const newCount = questionsUsed + 1;
    setQuestionsUsed(newCount);
    saveUsage(newCount);
    setCanAskQuestion(isPremium || newCount < FREE_DAILY_LIMIT);
  }, [questionsUsed, isPremium, saveUsage]);

  const remainingQuestions = isPremium ? Infinity : Math.max(0, FREE_DAILY_LIMIT - questionsUsed);

  return {
    questionsUsed,
    remainingQuestions,
    canAskQuestion,
    incrementUsage,
    dailyLimit: FREE_DAILY_LIMIT,
    isPremium,
  };
}
