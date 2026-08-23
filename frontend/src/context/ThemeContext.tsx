import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeColors {
  bg: string;
  bgCard: string;
  bgCardHover: string;
  bgInput: string;
  border: string;
  borderAccent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentGlow: string;
  accentBg: string;
}

const darkColors: ThemeColors = {
  bg: '#09090b', // Deep sleek black
  bgCard: 'rgba(255, 255, 255, 0.03)', // Frosted glass
  bgCardHover: 'rgba(255, 255, 255, 0.06)',
  bgInput: 'rgba(0, 0, 0, 0.5)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderAccent: 'rgba(139, 92, 246, 0.5)', // Electric Purple
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  accent: '#a855f7', // GenZ Purple/Magenta
  accentGlow: 'rgba(168, 85, 247, 0.6)',
  accentBg: 'rgba(168, 85, 247, 0.1)',
};

const lightColors: ThemeColors = {
  bg: '#fafafa', // Clean white
  bgCard: 'rgba(0, 0, 0, 0.02)',
  bgCardHover: 'rgba(0, 0, 0, 0.05)',
  bgInput: '#ffffff',
  border: 'rgba(0, 0, 0, 0.1)',
  borderAccent: 'rgba(139, 92, 246, 0.4)',
  text: '#09090b',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  accent: '#8b5cf6', // Vibrant Purple
  accentGlow: 'rgba(139, 92, 246, 0.4)',
  accentBg: 'rgba(139, 92, 246, 0.1)',
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: darkColors,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('sih_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('sih_theme', next);
      return next;
    });
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    document.body.style.background = colors.bg;
    document.body.style.color = colors.text;
  }, [colors]);

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
