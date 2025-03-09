// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { Appearance } from 'react-native';
// import EncryptedStorage from 'react-native-encrypted-storage';

// const ThemeContext = createContext();

// export const ThemeProvider = ({ children }) => {
//   const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');
//   const [userPreference, setUserPreference] = useState(null); // Track manual selection

//   // Toggle theme and save preference
//   const toggleTheme = async () => {
//     const newTheme = !isDarkMode;
//     setIsDarkMode(newTheme);
//     setUserPreference(newTheme); // Mark manual selection
//     try {
//       await EncryptedStorage.setItem('isDarkMode', JSON.stringify(newTheme));
//     } catch (error) {
//       console.error('Error saving theme preference:', error);
//     }
//   };

//   // Load saved theme preference on mount
//   useEffect(() => {
//     (async () => {
//       try {
//         const storedTheme = await EncryptedStorage.getItem('isDarkMode');
//         if (storedTheme !== null) {
//           setIsDarkMode(JSON.parse(storedTheme));
//           setUserPreference(JSON.parse(storedTheme)); // User manually selected theme
//         }
//       } catch (error) {
//         console.error('Error loading theme preference:', error);
//       }
//     })();
//   }, []);

//   // Detect system theme changes
//   useEffect(() => {
//     const subscription = Appearance.addChangeListener(({ colorScheme }) => {
//       if (userPreference === null) {
//         setIsDarkMode(colorScheme === 'dark'); // Only follow system if no manual selection
//       }
//     });

//     return () => subscription.remove(); // Cleanup listener
//   }, [userPreference]);

//   return (
//     <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };

// // Custom hook for consuming the theme context
// export const useTheme = () => useContext(ThemeContext);



import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkMode(colorScheme === 'dark'); // Always match system setting
    });

    return () => subscription.remove(); // Cleanup listener on unmount
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for consuming the theme context.
export const useTheme = () => useContext(ThemeContext);
