import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Brain, TrendingUp, Sparkles } from 'lucide-react';
import { StudyBuddy } from '@/components/StudyBuddy';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10"></div>
        <div className="container mx-auto relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-float">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Learning Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Quality Education for Every Kenyan Learner
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              HappyLearn supports <strong>UN SDG 4: Quality Education</strong> by providing accessible, 
              CBC-aligned learning tools tailored for Kenyan students from Grade 1 to Grade 9.
            </p>
            
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get personalized AI tutoring, track your learning journey, and master competencies 
              through voice-enabled interaction—designed with and for Kenyan learners.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Link to="/auth">
                    <Button size="lg" className="w-full sm:w-auto gap-2">
                      Get Started Free
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/lessons">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Browse Lessons
                    </Button>
                  </Link>
                  <Link to="/assessments">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Try Assessments
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/chat">
                    <Button size="lg" className="w-full sm:w-auto gap-2">
                      Start Learning
                      <Brain className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      View Dashboard
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Study Buddy Section - Instant Starter Activity */}
      {user && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Your Study Buddy
              </h2>
              <p className="text-muted-foreground">
                Quick win — get started with a personalized activity
              </p>
            </div>
            <StudyBuddy />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Choose HappyLearn?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience personalized education that adapts to your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered CBC Tutoring</h3>
              <p className="text-muted-foreground">
                Get instant help aligned with Kenya's Competency-Based Curriculum. Our AI understands your grade, subject, and learning needs—whether you type or speak.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">CBC-Aligned Content</h3>
              <p className="text-muted-foreground">
                Every lesson, topic, and assessment is mapped to official CBC learning outcomes for Grades 1-9, with local examples and Kenyan context.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-success-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Track Competency Growth</h3>
              <p className="text-muted-foreground">
                Monitor your mastery of CBC competencies—from Critical Thinking to Digital Literacy—and see your learning streak grow day by day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 rounded-3xl p-8 sm:p-12 text-center border border-primary/20">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Education is a Right, Not a Privilege
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join Kenyan students already using HappyLearn to access quality, inclusive, and equitable education—anywhere, anytime.
              </p>
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Start Learning Today
                  <Sparkles className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
