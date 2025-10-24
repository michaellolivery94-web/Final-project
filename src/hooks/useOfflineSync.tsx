import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QueuedReport {
  id: string;
  activity_id: string;
  score: number;
  time_spent_sec: number;
  metadata: any;
  timestamp: number;
}

const SYNC_QUEUE_KEY = 'happy-learn-sync-queue';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(0);
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back online! 🌐",
        description: "Syncing your progress...",
      });
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline 📴",
        description: "Don't worry - your progress is being saved locally.",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Load queue length on mount
  useEffect(() => {
    updateQueueLength();
  }, []);

  const updateQueueLength = () => {
    const queue = getQueue();
    setQueueLength(queue.length);
  };

  const getQueue = (): QueuedReport[] => {
    try {
      const data = localStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const setQueue = (queue: QueuedReport[]) => {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    setQueueLength(queue.length);
  };

  const addToQueue = useCallback((report: Omit<QueuedReport, 'id' | 'timestamp'>) => {
    const queue = getQueue();
    const newReport: QueuedReport = {
      ...report,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    queue.push(newReport);
    setQueue(queue);
  }, []);

  const syncQueue = useCallback(async () => {
    if (!navigator.onLine) return;

    const queue = getQueue();
    if (queue.length === 0) return;

    let successCount = 0;
    const failedItems: QueuedReport[] = [];

    for (const item of queue) {
      try {
        const { error } = await supabase.functions.invoke('studybuddy-report', {
          body: {
            activity_id: item.activity_id,
            score: item.score,
            time_spent_sec: item.time_spent_sec,
            metadata: item.metadata,
          },
        });

        if (error) throw error;
        successCount++;
      } catch (err) {
        console.error('Sync failed for item:', item.id, err);
        failedItems.push(item);
      }
    }

    setQueue(failedItems);

    if (successCount > 0) {
      toast({
        title: `Synced ${successCount} activity reports ✅`,
        description: failedItems.length > 0 ? `${failedItems.length} items still pending` : "All caught up!",
      });
    }
  }, [toast]);

  return {
    isOnline,
    queueLength,
    addToQueue,
    syncQueue,
  };
};
