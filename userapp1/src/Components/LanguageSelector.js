import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';

import { changeAppLanguage } from '../i18n/languageChange';
import { useTheme } from '../context/ThemeContext';

const LanguageSelector = () => {
  // List of supported languages
  const languages = [
    { label: 'English', code: 'en' },
    { label: 'हिंदी', code: 'hi' },
    { label: 'తెలుగు', code: 'te' },
  ];

  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(isDarkMode);
  const navigation = useNavigation();
  
  // We’ll store the language code (e.g., 'en', 'hi', 'te') in state
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  // Load the saved language code from EncryptedStorage when the component mounts
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguageCode = await EncryptedStorage.getItem('selectedLanguage');
        if (savedLanguageCode) {
          setSelectedLanguage(savedLanguageCode);
          changeAppLanguage(savedLanguageCode); // Switch the app language
        } else {
          // If nothing is saved, default to English
          setSelectedLanguage('en');
          changeAppLanguage('en');
        }
      } catch (error) {
        // console.log('Error loading language from EncryptedStorage:', error);
      }
    };
    loadSavedLanguage();
  }, []);

  // When a language is selected, update state & change the app language
  const onSelectLanguage = (lang) => {
    setSelectedLanguage(lang.code);
    changeAppLanguage(lang.code);
  };

  // Save the chosen language code to EncryptedStorage
  const onSaveSettings = async () => {
    try {
      await EncryptedStorage.setItem('selectedLanguage', selectedLanguage);
      // console.log('Language saved:', selectedLanguage);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
        }),
      );
    } catch (error) {
      // console.log('Error saving language to EncryptedStorage:', error);
    }
  };

  // Utility to get the display label from the selected code
  const getSelectedLanguageLabel = () => {
    const currentLang = languages.find((l) => l.code === selectedLanguage);
    return currentLang ? currentLang.label : '';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#212121'} paddingLeft={20}/>
              </TouchableOpacity>
              {/* <Text style={styles.headerText}>Languages</Text> */}
              {/* <Text style={styles.headerTitle}>
                {t('help_support') || 'Help & Support'}
              </Text> 
              <TouchableOpacity onPress={handleEmailPress}>
                <Ionicons name="mail-outline" size={24} color="#ff4500" />
              </TouchableOpacity> */}
            </View>
    <View style={styles.container}>
      {/* Header */}


      {/* Currently selected language */}
      <Text style={styles.sectionTitle}>Selected Language</Text>
      <View style={styles.selectedLanguageContainer}>
        <Text style={styles.selectedLanguageText}>
          {getSelectedLanguageLabel()}
        </Text>
      </View>

      {/* All languages */}
      <Text style={styles.sectionTitle}>All Languages</Text>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={styles.languageItem}
          onPress={() => onSelectLanguage(lang)}
        >
          <Text style={styles.languageText}>{lang.label}</Text>
          {selectedLanguage === lang.code ? (
            <Ionicons name="radio-button-on" size={24} color="#ff5722" />
          ) : (
            <Ionicons name="radio-button-off" size={24} color="#aaa" />
          )}
        </TouchableOpacity>
      ))}

      {/* Save Settings Button */}
      <TouchableOpacity style={styles.saveButton} onPress={onSaveSettings}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
};

const dynamicStyles = (isDarkMode) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      // paddingHorizontal: isTablet ? 24 : 20,
      // paddingVertical: isTablet ? 14 : 10,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
      elevation: 1,
    },
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#F5F6FA',
      paddingHorizontal: 20,
      paddingTop: 40,
    },
    headerText: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 20,
      color: isDarkMode ? '#fff' : '#000',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#ccc' : '#555',
      marginBottom: 8,
    },
    selectedLanguageContainer: {
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#ddd',
    },
    selectedLanguageText: {
      fontSize: 16,
      fontWeight: '500',
      color: isDarkMode ? '#fff' : '#000',
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#ddd',
    },
    languageText: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#000',
    },
    saveButton: {
      backgroundColor: '#ff5722',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default LanguageSelector;
