import React, {useState, useEffect, useCallback} from 'react';
import {View, TextInput, StyleSheet, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const VibrantSearchBar = ({onPress, isDarkMode, t}) => {
  const [placeholderText, setPlaceholderText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const initialPlaceholder = t('searchFor') || 'Search for ';
  const additionalTexts = [
    t('electrician') || 'Electrician',
    t('plumber') || 'Plumber',
    t('cleaningServices') || 'Cleaning',
    t('painter') || 'Painter',
    t('mechanic') || 'Mechanic',
  ];

  // Animated placeholder
  const updatePlaceholder = useCallback(() => {
    const word = additionalTexts[currentIndex];
    if (currentWordIndex < word.length) {
      setPlaceholderText(initialPlaceholder + word.substring(0, currentWordIndex + 1));
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setTimeout(() => {
        setPlaceholderText(initialPlaceholder);
        setCurrentIndex(prev => (prev + 1) % additionalTexts.length);
        setCurrentWordIndex(0);
      }, 1500);
    }
  }, [currentIndex, currentWordIndex, additionalTexts, initialPlaceholder]);

  useEffect(() => {
    const interval = setInterval(updatePlaceholder, 150);
    return () => clearInterval(interval);
  }, [updatePlaceholder]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.searchWrapper}
        onPress={onPress}
        activeOpacity={0.8}>
        <LinearGradient
          colors={isDarkMode ? ['#2a2a2a', '#1f1f1f'] : ['#ffffff', '#f5f5f5']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.gradientBorder}>
          <View style={[styles.innerContainer, {backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff'}]}>
            <Icon
              name="search-outline"
              size={20}
              color={isDarkMode ? '#B0B0B0' : '#757575'}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.input, {color: isDarkMode ? '#FFFFFF' : '#333333'}]}
              placeholder={placeholderText}
              placeholderTextColor={isDarkMode ? '#757575' : '#9E9E9E'}
              editable={false}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['#FF6B35', '#F24E1E']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.micButton}>
              <Icon name="mic-outline" size={18} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchWrapper: {
    borderRadius: 25,
  },
  gradientBorder: {
    borderRadius: 25,
    padding: 2,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 23,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'RobotoSlab-Medium',
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default VibrantSearchBar;
