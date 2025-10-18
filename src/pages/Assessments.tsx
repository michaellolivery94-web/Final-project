import { useState } from 'react';
import { GradeSelector } from '@/components/GradeSelector';
import { AssessmentGenerator } from '@/components/AssessmentGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Target, TrendingUp } from 'lucide-react';
import { getTopicsForSubject, CBCTopic } from '@/data/cbcStructure';

export default function Assessments() {
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<CBCTopic | null>(null);

  const handleSelectionChange = (grade: string, subject: string) => {
    setSelectedGrade(grade);
    setSelectedSubject(subject);
    setSelectedTopic(null);
  };

  const topics = selectedGrade && selectedSubject 
    ? getTopicsForSubject(selectedGrade, selectedSubject)
    : [];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">CBC-Aligned Formative Assessments</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Test Your Knowledge
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Practice with formative assessments aligned to Kenya's Competency-Based Curriculum. 
            Each question helps you master key learning outcomes.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">CBC Outcomes</h3>
                  <p className="text-sm text-muted-foreground">
                    Every question maps to official learning outcomes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                  <Target className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Instant Feedback</h3>
                  <p className="text-sm text-muted-foreground">
                    Get explanations for every answer immediately
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-success flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-success-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Track Growth</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor your competency development over time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grade and Subject Selection */}
        <div className="mb-8">
          <GradeSelector 
            onSelectionChange={handleSelectionChange}
            initialGrade={selectedGrade}
            initialSubject={selectedSubject}
          />
        </div>

        {/* Topic Selection or Assessment */}
        {!selectedTopic && topics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Select a Topic to Practice</CardTitle>
              <CardDescription>
                Choose a topic from {selectedSubject} for {selectedGrade}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {topics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTopic(topic)}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left group"
                  >
                    <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {topic.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {topic.description}
                    </p>
                    {topic.outcomeId && (
                      <span className="inline-block text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                        {topic.outcomeId}
                      </span>
                    )}
                    {topic.competency && (
                      <span className="inline-block text-xs px-2 py-1 rounded bg-secondary/10 text-secondary ml-2">
                        {topic.competency}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assessment Interface */}
        {selectedTopic && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Why this matters:</strong> Mastering {selectedTopic.name} helps you develop{' '}
                <strong>{selectedTopic.competency || 'key competencies'}</strong> aligned with Kenya's CBC framework, 
                supporting your journey toward quality education (SDG 4).
              </AlertDescription>
            </Alert>

            <AssessmentGenerator
              topic={selectedTopic.name}
              grade={selectedGrade}
              subject={selectedSubject}
              outcomeId={selectedTopic.outcomeId || ''}
            />

            <button
              onClick={() => setSelectedTopic(null)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to topic selection
            </button>
          </div>
        )}

        {!selectedGrade && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Select your grade and subject above to start practicing
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
