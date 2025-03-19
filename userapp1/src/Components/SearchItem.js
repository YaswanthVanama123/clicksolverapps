import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  BackHandler,
  useWindowDimensions,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import {
  CommonActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Import the theme hook
import { useTheme } from '../context/ThemeContext';

const SearchItem = () => {
  // Get screen dimensions
  const { width, height } = useWindowDimensions();
  // Get dark mode flag from context and generate dynamic styles accordingly
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);

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
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const navigation = useNavigation();

  const trendingSearches = [
    'Professional cleaning',
    'Electricians',
    'Plumbers',
    'Salon',
    'Carpenters',
    'Washing machine repair',
    'Refrigerator repair',
    'RO repair',
    'Furniture assembly',
    'Microwave repair',
  ];

  // Placeholder animation logic
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

  // Fetch recent searches from storage
  useEffect(() => {
    const recentServicesList = async () => {
      try {
        const recentarray = await EncryptedStorage.getItem('recentServices');
        if (recentarray) {
          setRecentSearches(JSON.parse(recentarray));
        }
      } catch (error) {
        console.error('Error fetching recent services:', error);
      }
    };
    recentServicesList();
  }, []);

  const handleInputChange = async (query) => {
    setSearchQuery(query);

    if (query.length > 0) {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://backend.clicksolver.com/api/services?search=${query}`
        );
        setSuggestions(response.data);
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
      setLoading(false);
    }
  };

  const storeRecentService = useCallback(async (service) => {
    try {
      const existingServicesJson = await EncryptedStorage.getItem('recentServices');
      let updatedServices = [];
      if (existingServicesJson) {
        const existingServices = JSON.parse(existingServicesJson);
        updatedServices = existingServices.filter(
          (existingService) =>
            existingService.main_service_id !== service.main_service_id
        );
        updatedServices.unshift(service);
      } else {
        updatedServices = [service];
      }
      updatedServices = updatedServices.slice(0, 5);
      await EncryptedStorage.setItem('recentServices', JSON.stringify(updatedServices));
      setRecentSearches(updatedServices);
    } catch (error) {
      console.error('Error storing recent service:', error);
    }
  }, []);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setSuggestions([]);
  }, []);

  const handleServiceClick = useCallback(
    (item) => {
      storeRecentService(item);
      navigation.push('ServiceBooking', {
        serviceName: item.service_category,
      });
    },
    [navigation, storeRecentService]
  );

  const renderSuggestionItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.suggestionItem}
      onPress={() => handleServiceClick(item)}
    >
      <Image
        source={{
          uri: item.service_details?.urls || 'https://via.placeholder.com/150',
        }}
        style={styles.suggestionImage}
      />
      <View style={styles.textContainer}>
        <Text style={styles.SuggestionText}>{item.service_tag}</Text>
        <Text style={styles.SuggestionDescription} numberOfLines={2}>
          {item.service_details?.about}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearchItem = (item, index) => (
    <TouchableOpacity
      key={`${item.main_service_id}-${index}`}
      style={styles.recentItem}
      onPress={() =>
        navigation.push('ServiceBooking', {
          serviceName: item.service_category,
        })
      }
    >
      <View style={styles.recentIcon}>
        <Entypo name="back-in-time" size={30} color="#d7d7d7" />
      </View>
      <Text style={styles.recentText}>{item.service_tag}</Text>
    </TouchableOpacity>
  );

  const renderTrendingSearches = () =>
    trendingSearches.map((item, index) => (
      <TouchableOpacity key={index} style={styles.trendingItem}>
        <Text style={styles.trendingText}>{item}</Text>
      </TouchableOpacity>
    ));

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        return false;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  const handleHome = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const inputRef = useRef(null);
  useFocusEffect(
    useCallback(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={handleHome}>
            <AntDesign
              name="arrowleft"
              size={isFocused ? 22 : 20}
              color={isDarkMode ? '#fff' : '#000'}
              style={styles.icon}
            />
          </TouchableOpacity>
          <View style={styles.searchInputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder={placeholderText}
              placeholderTextColor={isDarkMode ? "#aaa" : "#000"}
              value={searchQuery}
              onChangeText={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 100)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearIcon}>
                <Entypo name="circle-with-cross" size={20} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {searchQuery.length > 0 && suggestions.length > 0 && (
            <View style={styles.suggestionsList}>
              {suggestions.map((item, index) =>
                renderSuggestionItem(item, index)
              )}
            </View>
          )}
          {searchQuery.length > 0 &&
            suggestions.length === 0 &&
            !loading && (
              <View style={styles.noResultsContainer}>
                <MaterialIcons name="search-off" size={45} color={isDarkMode ? "#fff" : "#000"} />
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubText}>
                  We couldn't find what you were looking for. Please check your keywords again!
                </Text>
                <View style={[styles.horizontalLine, { width, height: 8 }]} />
                <View style={styles.trendingSearchesContainer}>
                  <Text style={styles.sectionTitle}>Trending searches</Text>
                  <View style={styles.trendingItemsContainer}>
                    {renderTrendingSearches()}
                  </View>
                </View>
              </View>
            )}
          {searchQuery.length === 0 && suggestions.length === 0 && (
            <View style={styles.searchSuggestionsContainer}>
              <View style={styles.recentSearchesContainer}>
                <Text style={styles.sectionTitle}>Recents</Text>
                {recentSearches.map((item, index) =>
                  renderRecentSearchItem(item, index)
                )}
              </View>
              <View style={[styles.horizontalLine, { width, height: 8 }]} />
              <View style={styles.trendingSearchesContainer}>
                <Text style={styles.sectionTitle}>Trending searches</Text>
                <View style={styles.trendingItemsContainer}>
                  {renderTrendingSearches()}
                </View>
              </View>
            </View>
          )}
          {loading && (
            <LottieView
              source={require('../assets/searchLoading.json')}
              autoPlay
              loop
              style={styles.loadingAnimation}
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

function dynamicStyles(width, height, isDarkMode) {
  const isTablet = width >= 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    mainContainer: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    scrollContainer: {
      flex: 1,
    },
    container: {
      width: '100%',
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    noResultsContainer: {
      alignItems: 'center',
      marginTop: isTablet ? 40 : 30,
      paddingHorizontal: isTablet ? 30 : 20,
    },
    loadingAnimation: {
      width: '100%',
      height: 100,
    },
    noResultsText: {
      fontSize: isTablet ? 22 : 20,
      color: isDarkMode ? '#fff' : '#555555',
      fontFamily: 'RobotoSlab-Medium',
    },
    noResultsSubText: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#ccc' : '#777777',
      textAlign: 'center',
      marginVertical: isTablet ? 24 : 20,
      padding: 6,
      fontFamily: 'RobotoSlab-Medium',
    },
    horizontalLine: {
      backgroundColor: isDarkMode ? '#333' : '#F0F0F0',
      marginVertical: 10,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: isDarkMode ? '#444' : '#ccc',
      borderWidth: 1,
      borderRadius: 5,
      backgroundColor: isDarkMode ? '#333' : '#ffffff',
      margin: isTablet ? 15 : 10,
      paddingHorizontal: isTablet ? 10 : 5,
    },
    icon: {
      paddingLeft: isTablet ? 10 : 5,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    searchInput: {
      flex: 1,
      height: isTablet ? 50 : 40,
      paddingLeft: 10,
      color: isDarkMode ? '#fff' : '#1D2951',
      fontWeight: '600',
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'RobotoSlab-Regular',
    },
    clearIcon: {
      position: 'absolute',
      right: 10,
    },
    searchSuggestionsContainer: {
      marginTop: isTablet ? 20 : 15,
    },
    recentSearchesContainer: {
      marginBottom: 15,
      padding: isTablet ? 15 : 10,
    },
    sectionTitle: {
      fontFamily: 'RobotoSlab-Medium',
      marginBottom: 10,
      fontSize: isTablet ? 18 : 16,
      color: isDarkMode ? '#fff' : '#000',
    },
    recentItem: {
      flexDirection: 'row',
      gap: 20,
      paddingVertical: 10,
    },
    recentIcon: {
      padding: 5,
      backgroundColor: isDarkMode ? '#444' : '#F8F8F8',
      borderRadius: 10,
    },
    recentText: {
      color: isDarkMode ? '#fff' : '#000',
      alignSelf: 'center',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 16 : 14,
    },
    trendingSearchesContainer: {
      marginBottom: 15,
      padding: isTablet ? 15 : 10,
    },
    trendingItemsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    trendingItem: {
      padding: isTablet ? 12 : 10,
      borderRadius: 20,
      borderColor: isDarkMode ? '#444' : '#ccc',
      borderWidth: 1,
      marginRight: 10,
      marginBottom: 10,
    },
    trendingText: {
      color: isDarkMode ? '#fff' : '#000',
      fontFamily: 'RobotoSlab-Regular',
      fontSize: isTablet ? 16 : 14,
    },
    suggestionsList: {
      marginTop: 5,
      backgroundColor: isDarkMode ? '#333' : '#fff',
      borderRadius: 5,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
      padding: isTablet ? 12 : 10,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#444' : '#eee',
    },
    suggestionImage: {
      width: isTablet ? 85 : 70,
      height: isTablet ? 80 : 65,
      borderRadius: 5,
      marginRight: 10,
    },
    textContainer: {
      flex: 1,
    },
    SuggestionText: {
      color: isDarkMode ? '#fff' : '#1D2951',
      fontWeight: '500',
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'RobotoSlab-Medium',
    },
    SuggestionDescription: {
      fontSize: isTablet ? 14 : 12,
      color: isDarkMode ? '#ccc' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Regular',
    },
  });
}

export default SearchItem;
