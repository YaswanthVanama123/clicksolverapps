import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const QuickSearch = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(isDarkMode);
  const navigation = useNavigation();

  // Build initial text and additional texts from translations.
  const initialPlaceholder = t('searchFor') + ' ';
  const additionalTexts = [
    t('electrician'),
    t('plumber'),
    t('cleaningServices'),
    t('painter'),
    t('mechanic'),
  ];

  const [placeholderText, setPlaceholderText] = useState(initialPlaceholder);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Update placeholder text letter by letter
  const updatePlaceholder = useCallback(() => {
    const word = additionalTexts[currentIndex];
    if (currentWordIndex < word.length) {
      setPlaceholderText(prev => prev + word[currentWordIndex]);
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setPlaceholderText(initialPlaceholder);
      setCurrentIndex(prev => (prev + 1) % additionalTexts.length);
      setCurrentWordIndex(0);
    }
  }, [currentIndex, currentWordIndex, additionalTexts, initialPlaceholder]);

  useEffect(() => {
    const interval = setInterval(updatePlaceholder, 200);
    return () => clearInterval(interval);
  }, [updatePlaceholder]);

  const handleInputChange = useCallback(query => {
    setSearchQuery(query);
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    navigation.navigate('SearchItem');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholderText}
        placeholderTextColor={isDarkMode ? "#aaa" : "#000"}
        fontFamily="RobotoSlab-Medium"
        value={searchQuery}
        onChangeText={handleInputChange}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setIsFocused(false), 100)}
      />
    </View>
  );
};

const dynamicStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      width: '100%',
      padding: 10,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 1,
    },
    searchInput: {
      height: 40,
      borderColor: isDarkMode ? '#444' : '#ccc',
      borderWidth: 1,
      borderRadius: 5,
      paddingLeft: 10,
      backgroundColor: isDarkMode ? '#222' : '#ffffff',
      fontWeight: '500',
      color: isDarkMode ? '#fff' : '#555',
      opacity: 0.9,
    },
  });

export default QuickSearch;
