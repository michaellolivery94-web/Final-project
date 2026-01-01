import { Crown, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";

interface PremiumBannerProps {
  feature?: string;
  compact?: boolean;
}

export function PremiumBanner({ feature = "this feature", compact = false }: PremiumBannerProps) {
  const { isPremium, loading } = useSubscription();
  const { user } = useAuth();

  if (loading || isPremium) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/20 border border-accent/30">
        <Lock className="h-4 w-4 text-accent" />
        <span className="text-sm text-muted-foreground">Premium feature</span>
        <Link to="/pricing">
          <Button size="sm" variant="outline" className="h-7 text-xs">
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border border-primary/20 p-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
      
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
          <Crown className="h-6 w-6 text-accent-foreground" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            Unlock {feature}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upgrade to Premium to access unlimited learning, full CBC content, and progress tracking.
          </p>
        </div>

        <Link to={user ? "/pricing" : "/auth"}>
          <Button className="gap-2 whitespace-nowrap">
            <Crown className="h-4 w-4" />
            {user ? "Go Premium" : "Sign Up Free"}
          </Button>
        </Link>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">
          From KES 249/month
        </span>
        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
          Cheaper than tuition
        </span>
        <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">
          M-Pesa accepted
        </span>
      </div>
    </div>
  );
}
