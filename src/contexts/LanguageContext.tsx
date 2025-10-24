import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    studyBuddy: 'Study Buddy',
    quickWin: 'Quick win',
    whyThis: 'Why this?',
    submitAnswer: 'Submit Answer',
    nextActivity: 'Next Activity',
    skip: 'Skip',
    correct: 'Correct! 🎉',
    keepLearning: 'Keep learning! 💪',
    explanation: 'Explanation:',
    offline: "You're offline 📴",
    offlineMessage: "Don't worry - using cached activities",
    backOnline: 'Back online! 🌐',
    syncing: 'Syncing your progress...',
  },
  sw: {
    studyBuddy: 'Rafiki wa Kusoma',
    quickWin: 'Ushindi wa haraka',
    whyThis: 'Kwa nini hii?',
    submitAnswer: 'Wasilisha Jibu',
    nextActivity: 'Shughuli Inayofuata',
    skip: 'Ruka',
    correct: 'Sahihi! 🎉',
    keepLearning: 'Endelea kujifunza! 💪',
    explanation: 'Maelezo:',
    offline: 'Huna mtandao 📴',
    offlineMessage: 'Usiwe na wasiwasi - tunatumia shughuli zilizohifadhiwa',
    backOnline: 'Mtandao umerejea! 🌐',
    syncing: 'Inasawazisha maendeleo yako...',
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('happy-learn-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('happy-learn-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
