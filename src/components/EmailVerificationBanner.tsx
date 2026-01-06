import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function EmailVerificationBanner() {
  const { user, isEmailVerified, resendVerificationEmail } = useAuth();
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

  // Don't show if no user or email is already verified
  if (!user || isEmailVerified) {
    return null;
  }

  const handleResend = async () => {
    setResending(true);
    const { error } = await resendVerificationEmail();
    
    if (error) {
      toast({
        title: 'Failed to send verification email',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Verification email sent!',
        description: 'Please check your inbox and spam folder.',
      });
    }
    setResending(false);
  };

  return (
    <Alert className="border-warning/50 bg-warning/10">
      <Mail className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning">Email not verified</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span className="text-muted-foreground">
          Please verify your email address ({user.email}) to access all features.
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={resending}
          className="w-fit"
        >
          {resending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Resend verification email
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function EmailVerificationStatus() {
  const { user, isEmailVerified } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {isEmailVerified ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">Email verified</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4 text-warning" />
          <span className="text-warning">Email not verified</span>
        </>
      )}
    </div>
  );
}
