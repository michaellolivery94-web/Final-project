import { AlertTriangle, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

interface QuestionLimitBannerProps {
  questionsUsed: number;
  dailyLimit: number;
  remainingQuestions: number;
  isPremium: boolean;
}

export function QuestionLimitBanner({
  questionsUsed,
  dailyLimit,
  remainingQuestions,
  isPremium,
}: QuestionLimitBannerProps) {
  if (isPremium) {
    return (
      <div className="flex items-center gap-2 text-xs text-primary">
        <Crown className="h-3 w-3" />
        <span>Premium - Unlimited questions</span>
      </div>
    );
  }

  const usagePercent = (questionsUsed / dailyLimit) * 100;
  const isLow = remainingQuestions <= 2 && remainingQuestions > 0;
  const isExhausted = remainingQuestions === 0;

  if (isExhausted) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Daily limit reached!</span>
        </div>
        <p className="text-xs text-muted-foreground">
          You've used all {dailyLimit} free questions for today. Upgrade to Premium for unlimited learning!
        </p>
        <Button asChild size="sm" className="w-full gap-2">
          <Link to="/pricing">
            <Sparkles className="h-3 w-3" />
            Upgrade to Premium
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={isLow ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground'}>
          {remainingQuestions} question{remainingQuestions !== 1 ? 's' : ''} left today
        </span>
        <span className="text-muted-foreground">
          {questionsUsed}/{dailyLimit}
        </span>
      </div>
      <Progress 
        value={usagePercent} 
        className={`h-1.5 ${isLow ? '[&>div]:bg-amber-500' : ''}`}
      />
      {isLow && (
        <Link 
          to="/pricing" 
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Sparkles className="h-3 w-3" />
          Get unlimited with Premium
        </Link>
      )}
    </div>
  );
}
