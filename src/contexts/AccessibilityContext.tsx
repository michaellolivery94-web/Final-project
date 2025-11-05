import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  voiceEnabled: boolean;
  toggleVoice: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('happy-learn-font-size') as any) || 'medium';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('happy-learn-high-contrast') === 'true';
  });

  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('happy-learn-voice') === 'true';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('happy-learn-theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('happy-learn-font-size', fontSize);
    document.documentElement.classList.remove('text-small', 'text-medium', 'text-large');
    document.documentElement.classList.add(`text-${fontSize}`);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('happy-learn-high-contrast', String(highContrast));
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('happy-learn-voice', String(voiceEnabled));
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem('happy-learn-theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSizeState(size);
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        toggleHighContrast,
        voiceEnabled,
        toggleVoice,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
