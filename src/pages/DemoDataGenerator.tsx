import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function DemoDataGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const generateDemoData = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-demo-data', {
        method: 'POST'
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Success!",
        description: `Generated ${data.students?.length || 0} demo students with complete learning data`,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate demo data",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Demo Data Generator</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Generate realistic student data for HappyLearn demonstration
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Generate Demo Students
            </CardTitle>
            <CardDescription>
              This will create 8 demo student accounts with:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Complete user profiles</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Learning progress data</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Skill proficiencies</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Activity completion reports</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Chat learning history</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Varied learning streaks</span>
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-xs sm:text-sm">
                <strong>Note:</strong> Demo accounts use the password: <code className="bg-muted px-2 py-0.5 rounded">Demo123!</code>
              </AlertDescription>
            </Alert>

            <Button 
              onClick={generateDemoData} 
              disabled={loading}
              className="w-full sm:w-auto"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Generate Demo Data
                </>
              )}
            </Button>

            {result && (
              <div className="mt-6 space-y-4">
                <Alert className="bg-primary/10 border-primary">
                  <AlertDescription>
                    <strong>Success!</strong> {result.message}
                  </AlertDescription>
                </Alert>

                {result.students && result.students.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Created Demo Students:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                      {result.students.map((student: any, index: number) => (
                        <div key={index} className="bg-muted p-3 rounded-lg">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-muted-foreground text-xs">{student.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
