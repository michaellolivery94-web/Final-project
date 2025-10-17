import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConsentDialogProps {
  open: boolean;
  onConsent: () => void;
}

export function ConsentDialog({ open, onConsent }: ConsentDialogProps) {
  const [voiceConsent, setVoiceConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  const handleAccept = () => {
    if (voiceConsent && dataConsent) {
      localStorage.setItem('happy_learn_consent', JSON.stringify({
        voice: voiceConsent,
        data: dataConsent,
        analytics: analyticsConsent,
        timestamp: new Date().toISOString(),
      }));
      onConsent();
    }
  };

  const canProceed = voiceConsent && dataConsent;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Happy Learn! 🎓</DialogTitle>
          <DialogDescription>
            Your Learning Companion for Quality Education (SDG 4)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">🛡️ Your Privacy Matters</h3>
              <p className="text-muted-foreground mb-4">
                Happy Learn is designed with and for Kenyan learners. We comply with the 
                Kenya Data Protection Act (2019) and protect your personal information.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">📋 Data We Collect</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Learning Progress:</strong> Questions asked, lessons completed, and study time</li>
                <li><strong>Voice Data:</strong> Processed locally on your device (not stored on servers)</li>
                <li><strong>Account Info:</strong> Email and display name (encrypted and secure)</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">🔐 How We Protect You</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>All data is encrypted using industry-standard protocols</li>
                <li>Voice recognition happens on your device - we don't record audio</li>
                <li>You can delete your data anytime from your dashboard</li>
                <li>We never sell or share your personal information</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">✅ Your Consent</h3>
              <div className="space-y-4 mt-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="voice"
                    checked={voiceConsent}
                    onCheckedChange={(checked) => setVoiceConsent(checked as boolean)}
                  />
                  <label htmlFor="voice" className="text-sm leading-relaxed cursor-pointer">
                    <strong>Voice Assistant (Required):</strong> I understand that voice recognition 
                    processes my speech locally on my device to help me learn. Audio is not recorded or stored.
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="data"
                    checked={dataConsent}
                    onCheckedChange={(checked) => setDataConsent(checked as boolean)}
                  />
                  <label htmlFor="data" className="text-sm leading-relaxed cursor-pointer">
                    <strong>Learning Progress (Required):</strong> I agree to securely store my 
                    learning progress, questions, and study metrics to personalize my experience.
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="analytics"
                    checked={analyticsConsent}
                    onCheckedChange={(checked) => setAnalyticsConsent(checked as boolean)}
                  />
                  <label htmlFor="analytics" className="text-sm leading-relaxed cursor-pointer">
                    <strong>Anonymous Analytics (Optional):</strong> Help us improve Happy Learn by 
                    sharing anonymized usage patterns (no personal information).
                  </label>
                </div>
              </div>
            </section>

            <section className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Your Rights:</strong> You can withdraw consent, request data deletion, or 
                export your data anytime from Settings → Privacy. For questions, contact our Data 
                Protection Officer at privacy@happylearn.ke (example contact).
              </p>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={handleAccept}
            disabled={!canProceed}
            className="w-full"
          >
            {canProceed ? "Accept & Continue" : "Please accept required consents"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
