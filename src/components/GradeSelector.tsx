import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { gradesList, getSubjectsForGrade, getTopicsForSubject } from '@/data/cbcStructure';
import { GraduationCap, BookOpen, Target } from 'lucide-react';

interface GradeSelectorProps {
  onSelectionChange: (grade: string, subject: string) => void;
  initialGrade?: string;
  initialSubject?: string;
  compact?: boolean;
}

export function GradeSelector({
  onSelectionChange,
  initialGrade = 'Grade 1',
  initialSubject = '',
  compact = false,
}: GradeSelectorProps) {
  const [selectedGrade, setSelectedGrade] = useState(initialGrade);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    const availableSubjects = getSubjectsForGrade(selectedGrade);
    setSubjects(availableSubjects);

    if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [selectedGrade]);

  useEffect(() => {
    if (selectedGrade && selectedSubject) {
      onSelectionChange(selectedGrade, selectedSubject);
    }
  }, [selectedGrade, selectedSubject, onSelectionChange]);

  const topics = getTopicsForSubject(selectedGrade, selectedSubject);

  if (compact) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="flex-1">
          <Label htmlFor="grade-select" className="text-xs mb-1 flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            Grade Level
          </Label>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger id="grade-select" className="w-full">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {gradesList.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Label htmlFor="subject-select" className="text-xs mb-1 flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            Subject
          </Label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger id="subject-select" className="w-full">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Choose Your Learning Path
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select your grade and subject based on the Kenyan Competency-Based Curriculum (CBC)
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="grade-select-full" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Grade Level
              </Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger id="grade-select-full">
                  <SelectValue placeholder="Select your grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradesList.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject-select-full" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Subject Area
              </Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={subjects.length === 0}
              >
                <SelectTrigger id="subject-select-full">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {topics.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <Label className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                Topics in this subject:
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topics.map((topic, index) => (
                  <div
                    key={index}
                    className="text-sm p-2 rounded bg-background hover:bg-accent/50 transition-colors"
                  >
                    <div className="font-medium">{topic.name}</div>
                    {topic.description && (
                      <div className="text-xs text-muted-foreground">{topic.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
