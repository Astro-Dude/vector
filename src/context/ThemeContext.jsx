import { createContext, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Always use light theme
  const theme = 'light';

  // Update the HTML element class on mount
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove dark class if it exists
    root.classList.remove('dark');
    
    // Add the light class
    root.classList.add('light');
    
    // Save to localStorage to maintain consistency
    localStorage.setItem('theme', 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 