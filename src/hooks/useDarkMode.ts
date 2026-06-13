import { useEffect } from 'react';

export const useDarkMode = () => {
  useEffect(() => {
    // Dark-only design system - always force dark class
    document.documentElement.classList.add('dark');
  }, []);

  return {
    isDarkMode: true,
    toggleDarkMode: () => {},
  };
};
