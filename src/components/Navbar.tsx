import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AccessibilityMenu } from './AccessibilityMenu';
import { BookOpen, MessageSquare, LayoutDashboard, LogOut, Menu, X, Target, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function Navbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const checkTeacherRole = async () => {
      if (!user) {
        setIsTeacher(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['teacher', 'admin']);

      setIsTeacher(!!data && data.length > 0);
    };

    checkTeacherRole();
  }, [user]);

  const navLinks = [
    { path: '/lessons', label: 'Lessons', icon: BookOpen },
    { path: '/assessments', label: 'Assessments', icon: Target },
    { path: '/chat', label: 'AI Tutor', icon: MessageSquare },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  // Add teacher dashboard for teachers
  const allLinks = isTeacher
    ? [...navLinks, { path: '/teacher-dashboard', label: 'Teacher', icon: Users }]
    : navLinks;

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-primary-foreground text-lg">🎓</span>
            </div>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              HappyLearn
            </span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              {allLinks.map(({ path, label, icon: Icon }) => (
                <Link key={path} to={path}>
                  <Button
                    variant={isActive(path) ? "default" : "ghost"}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              ))}
              <AccessibilityMenu />
              <Button
                variant="ghost"
                onClick={() => signOut()}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          )}

          {!user && (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/auth">
                <Button variant="default">Get Started</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          {user && (
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && user && (
          <div className="md:hidden py-4 space-y-2 border-t border-border">
            {allLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant={isActive(path) ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
            <div className="px-2 py-2">
              <AccessibilityMenu />
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                signOut();
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
