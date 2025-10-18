import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  outcomeId: string;
}

interface AssessmentGeneratorProps {
  topic: string;
  grade: string;
  subject: string;
  outcomeId: string;
}

// Sample questions mapped to CBC outcomes for Grade 4 Math Fractions
const sampleQuestions: Record<string, Question[]> = {
  'CBC-MATH-4.3': [
    {
      question: "If a pizza is cut into 8 equal slices and you eat 3 slices, what fraction of the pizza did you eat?",
      options: ["1/8", "3/8", "5/8", "3/5"],
      correctAnswer: "3/8",
      explanation: "You ate 3 slices out of 8 total slices. This is written as 3/8 (three-eighths).",
      outcomeId: "CBC-MATH-4.3"
    },
    {
      question: "Which fraction is equivalent to one half?",
      options: ["2/3", "2/4", "3/4", "1/3"],
      correctAnswer: "2/4",
      explanation: "2/4 equals 1/2 because when you simplify 2/4 (divide both numbers by 2), you get 1/2.",
      outcomeId: "CBC-MATH-4.3"
    },
    {
      question: "A farmer divides his shamba into 4 equal parts and plants maize in 3 parts. What fraction is planted with maize?",
      options: ["1/4", "3/4", "4/3", "2/4"],
      correctAnswer: "3/4",
      explanation: "3 out of 4 parts are planted with maize, which is 3/4 (three-quarters) of the shamba.",
      outcomeId: "CBC-MATH-4.3"
    }
  ]
};

export function AssessmentGenerator({ topic, grade, subject, outcomeId }: AssessmentGeneratorProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Fetch questions for the specific outcome ID
  const questions = sampleQuestions[outcomeId] || [];
  const currentQuestion = questions[currentQuestionIndex];

  // Handle answer submission
  const handleSubmit = () => {
    if (!selectedAnswer) return;
    
    setShowFeedback(true);
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  // Move to next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer("");
      setShowFeedback(false);
    } else {
      setIsComplete(true);
    }
  };

  // Reset assessment
  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setShowFeedback(false);
    setScore(0);
    setIsComplete(false);
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              Formative assessments for this topic are coming soon. For now, try asking our AI tutor questions about {topic}!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 60;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Assessment Complete!</CardTitle>
          <CardDescription>
            {grade} • {subject} • {topic}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="text-5xl font-bold mb-2 text-primary">{percentage}%</div>
            <p className="text-lg mb-4">
              You scored {score} out of {questions.length}
            </p>
            {passed ? (
              <Alert className="border-success bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-success-foreground">
                  Great job! You've demonstrated competency in {topic}.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-accent bg-accent/10">
                <Lightbulb className="h-4 w-4 text-accent-foreground" />
                <AlertDescription className="text-accent-foreground">
                  Keep practicing! Review the topic and try again when you're ready.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <Button onClick={handleReset} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium text-primary">
            Score: {score}/{questions.length}
          </span>
        </div>
        <CardTitle className="text-lg">{topic}</CardTitle>
        <CardDescription>
          {grade} • {subject} • Outcome: {outcomeId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-4">{currentQuestion.question}</h3>
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={option} id={`option-${index}`} disabled={showFeedback} />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="flex-1 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {showFeedback && (
          <Alert className={selectedAnswer === currentQuestion.correctAnswer ? "border-success bg-success/10" : "border-destructive bg-destructive/10"}>
            {selectedAnswer === currentQuestion.correctAnswer ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <AlertDescription>
              <p className="font-medium mb-1">
                {selectedAnswer === currentQuestion.correctAnswer ? "Correct!" : "Not quite right."}
              </p>
              <p className="text-sm">{currentQuestion.explanation}</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {!showFeedback ? (
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedAnswer}
              className="flex-1"
            >
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNext} className="flex-1">
              {currentQuestionIndex < questions.length - 1 ? "Next Question" : "View Results"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
