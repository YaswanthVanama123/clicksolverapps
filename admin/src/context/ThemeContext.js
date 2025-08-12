// src/context/ThemeContext.js
import React, {createContext, useContext, useState, useEffect} from 'react';
import {Appearance} from 'react-native';

const ThemeContext = createContext({
  // safe defaults
  isDarkMode: false,
  themeMode: 'system',
  toggleTheme: () => {},
  useSystemTheme: () => {},
});

export const ThemeProvider = ({children}) => {
  const systemScheme = Appearance.getColorScheme();
  const [themeMode, setThemeMode] = useState('system');
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');

  // Listen for system changes when in “system” mode
  useEffect(() => {
    if (themeMode === 'system') {
      const sub = Appearance.addChangeListener(({colorScheme}) =>
        setIsDarkMode(colorScheme === 'dark'),
      );
      return () => sub.remove();
    }
  }, [themeMode]);

  const toggleTheme = () => {
    if (themeMode === 'system') {
      setThemeMode('manual');
      setIsDarkMode(prev => !prev);
    } else {
      setIsDarkMode(prev => !prev);
    }
  };

  const useSystemTheme = () => {
    setThemeMode('system');
    setIsDarkMode(Appearance.getColorScheme() === 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{isDarkMode, themeMode, toggleTheme, useSystemTheme}}>
      {children}
    </ThemeContext.Provider>
  );
};

// throw if used outside provider
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
