import React, {useState, useEffect, useCallback} from 'react';
import {View, TextInput, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const QuickSearch = () => {
  const initialPlaceholder = 'Search for ';
  const additionalTexts = [
    'electrician',
    'plumber',
    'cleaning services',
    'painter',
    'mechanic',
  ];

  const [placeholderText, setPlaceholderText] = useState(initialPlaceholder);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = useNavigation();
  const [isFocused, setIsFocused] = useState(false);

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
        placeholderTextColor="#000"
        fontStyle="italic"
        fontFamily="RobotoSlab-Regular"
        value={searchQuery}
        onChangeText={handleInputChange}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setIsFocused(false), 100)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 10,
    backgroundColor: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    backgroundColor: '#ffffff',
    fontWeight: '500',
    color: '#555555',
    opacity: 0.5,
  },
});

export default QuickSearch;
