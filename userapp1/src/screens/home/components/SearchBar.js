import React, {memo, useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Animated,
  useWindowDimensions,
  Keyboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../../../context/ThemeContext';
import {GRADIENTS} from '../../../theme/gradients';
import {getColors} from '../../../theme/colors';

const TRENDING_SEARCHES = [
  {id: 1, text: 'Electrician', icon: 'flash'},
  {id: 2, text: 'Plumber', icon: 'water'},
  {id: 3, text: 'Cleaning', icon: 'broom'},
  {id: 4, text: 'AC Repair', icon: 'snow'},
  {id: 5, text: 'Painter', icon: 'color-palette'},
];

const SearchBar = ({
  onFocus,
  onSearch,
  placeholder = 'Search for services...',
  showTrendingChips = true,
  showVoiceSearch = true,
}) => {
  const {width} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const navigation = useNavigation();

  const [isFocused, setIsFocused] = useState(false);
  const [searchText, setSearchText] = useState('');
  const borderAnimation = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  useEffect(() => {
    Animated.timing(borderAnimation, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
    // Navigate to search screen
    navigation.navigate('SearchItem');
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleSearch = text => {
    setSearchText(text);
    if (onSearch) {
      onSearch(text);
    }
  };

  const handleTrendingChipPress = searchTerm => {
    setSearchText(searchTerm.text);
    if (onSearch) {
      onSearch(searchTerm.text);
    }
    navigation.navigate('SearchItem', {query: searchTerm.text});
  };

  const handleVoiceSearch = () => {
    // Implement voice search functionality
    console.log('Voice search pressed');
  };

  const borderColor = borderAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDarkMode ? '#444' : '#E5E7EB',
      GRADIENTS.primaryGradient.colors[0],
    ],
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchBarContainer,
          {
            backgroundColor: isDarkMode ? '#1A1A2E' : '#F8F9FA',
            borderColor: borderColor,
            borderWidth: 2,
          },
        ]}>
        {isFocused && (
          <LinearGradient
            colors={[
              GRADIENTS.primaryGradient.colors[0],
              GRADIENTS.primaryGradient.colors[1],
            ]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.gradientBorder}
          />
        )}

        <View style={styles.searchBarContent}>
          <Icon
            name="search"
            size={20}
            color={isFocused ? colors.primary : isDarkMode ? '#B4B4B4' : '#6B7280'}
          />

          <TextInput
            ref={inputRef}
            style={[
              styles.searchInput,
              {color: isDarkMode ? '#FFFFFF' : '#1A1A1A'},
            ]}
            placeholder={placeholder}
            placeholderTextColor={isDarkMode ? '#888888' : '#9CA3AF'}
            value={searchText}
            onChangeText={handleSearch}
            onFocus={handleFocus}
            onBlur={handleBlur}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (searchText.trim()) {
                navigation.navigate('SearchItem', {query: searchText});
              }
            }}
          />

          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              activeOpacity={0.7}>
              <Icon
                name="close-circle"
                size={20}
                color={isDarkMode ? '#B4B4B4' : '#6B7280'}
              />
            </TouchableOpacity>
          )}

          {showVoiceSearch && searchText.length === 0 && (
            <TouchableOpacity
              onPress={handleVoiceSearch}
              activeOpacity={0.7}
              style={styles.voiceButton}>
              <Icon
                name="mic"
                size={20}
                color={isDarkMode ? '#B4B4B4' : '#6B7280'}
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Trending Searches */}
      {showTrendingChips && !isFocused && (
        <View style={styles.trendingContainer}>
          <Text
            style={[
              styles.trendingTitle,
              {color: isDarkMode ? '#B4B4B4' : '#6B7280'},
            ]}>
            Trending
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}>
            {TRENDING_SEARCHES.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isDarkMode ? '#1A1A2E' : '#FFFFFF',
                    borderColor: isDarkMode ? '#333' : '#E5E7EB',
                  },
                ]}
                onPress={() => handleTrendingChipPress(item)}
                activeOpacity={0.8}>
                <Icon
                  name={item.icon}
                  size={16}
                  color={isDarkMode ? '#FFFFFF' : '#1A1A1A'}
                />
                <Text
                  style={[
                    styles.chipText,
                    {color: isDarkMode ? '#FFFFFF' : '#1A1A1A'},
                  ]}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchBarContainer: {
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  searchBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'RobotoSlab-Regular',
    paddingVertical: 0,
  },
  voiceButton: {
    padding: 4,
  },
  trendingContainer: {
    marginTop: 12,
  },
  trendingTitle: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Medium',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  chipsContainer: {
    paddingRight: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'RobotoSlab-Medium',
  },
});

export default memo(SearchBar);
