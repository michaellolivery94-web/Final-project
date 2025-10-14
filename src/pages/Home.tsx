import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Brain, TrendingUp, Sparkles } from 'lucide-react';

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
              Learn Smarter with{' '}
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                HappyLearn
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your personal AI tutor that adapts to your learning style. Get instant help,
              track your progress, and achieve your educational goals with confidence.
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
              <h3 className="text-xl font-bold mb-3">AI-Powered Tutoring</h3>
              <p className="text-muted-foreground">
                Get instant, personalized help from our advanced AI tutor that understands your learning style
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Curated Lessons</h3>
              <p className="text-muted-foreground">
                Access a library of expertly designed lessons across multiple subjects and difficulty levels
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-success-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor your learning journey with detailed analytics and celebrate your achievements
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
                Ready to Transform Your Learning?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of students already learning smarter with HappyLearn
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
