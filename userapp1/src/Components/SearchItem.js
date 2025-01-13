import React, {useState, useEffect, useCallback, useRef} from 'react';
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

const SearchItem = () => {
  const initialPlaceholder = 'Search for ';
  const screenWidth = Dimensions.get('window').width;
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
  const inputRef = useRef(null);

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

  /**
   * Placeholder animation logic
   */
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

  /**
   * Fetch recent services from EncryptedStorage
   */
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

  /**
   * Handle user typing in the search box
   */
  const handleInputChange = async query => {
    setSearchQuery(query);

    if (query.length > 0) {
      setIsFocused(true);
      setLoading(true);
      try {
        const response = await axios.get(
          `https://backend.clicksolver.com/api/services?search=${query}`,
        );
        setSuggestions(response.data);
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setIsFocused(false);
      setSuggestions([]);
      setLoading(false);
    }
  };

  /**
   * Store a clicked service to recent services
   */
  const storeRecentService = useCallback(async service => {
    try {
      const existingServicesJson = await EncryptedStorage.getItem(
        'recentServices',
      );
      let updatedServices = [];
      if (existingServicesJson) {
        const existingServices = JSON.parse(existingServicesJson);

        // Filter out any existing entry for the same service
        updatedServices = existingServices.filter(
          existingService =>
            existingService.main_service_id !== service.main_service_id,
        );
        // Add new service at the beginning
        updatedServices.unshift(service);
      } else {
        updatedServices = [service];
      }

      // Keep only the latest 5
      updatedServices = updatedServices.slice(0, 5);

      await EncryptedStorage.setItem(
        'recentServices',
        JSON.stringify(updatedServices),
      );
      setRecentSearches(updatedServices);
    } catch (error) {
      console.error('Error storing recent service:', error);
    }
  }, []);

  /**
   * Clear the search box
   */
  const handleClear = useCallback(() => {
    setSearchQuery('');
    setSuggestions([]);
    setIsFocused(false);
  }, []);

  /**
   * Handle clicking on a suggestion (service)
   */
  const handleServiceClick = useCallback(
    item => {
      // Store the recent service
      storeRecentService(item);
      // Navigate to the ServiceBooking screen with the required parameters
      navigation.push('ServiceBooking', {
        serviceName: item.service_category,
      });
    },
    [navigation, storeRecentService],
  );

  /**
   * Render a single suggestion item
   */
  const renderSuggestionItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.suggestionItem}
      onPress={() => handleServiceClick(item)}>
      {console.log('items are there', item)}
      {/* <Image
        source={{uri: item.service_urls || 'https://via.placeholder.com/150'}}
        style={styles.suggestionImage}
      /> */}
      <Image
        source={{uri: item.service_urls || 'https://via.placeholder.com/150'}}
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

  /**
   * Render a single recent search item
   */
  const renderRecentSearchItem = (item, index) => (
    <TouchableOpacity
      key={`${item.main_service_id}-${index}`}
      style={styles.recentItem}
      onPress={() =>
        navigation.push('ServiceBooking', {
          serviceName: item.service_category,
        })
      }>
      <View style={styles.recentIcon}>
        <Entypo name="back-in-time" size={30} color="#d7d7d7" />
      </View>
      <Text style={styles.recentText}>{item.service_tag}</Text>
    </TouchableOpacity>
  );

  /**
   * Render trending searches
   */
  const renderTrendingSearches = () =>
    trendingSearches.map((item, index) => (
      <TouchableOpacity key={index} style={styles.trendingItem}>
        <Text style={styles.trendingText}>{item}</Text>
      </TouchableOpacity>
    ));

  /**
   * Override back button behavior
   */
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
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  /**
   * Handle going back (arrow left)
   */
  const handleHome = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /**
   * Focus the input whenever this screen is in focus
   */
  useFocusEffect(
    useCallback(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []),
  );

  return (
    <View style={styles.mainContainer}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={handleHome}>
          <AntDesign
            name="arrowleft"
            size={20}
            color="#000"
            style={styles.icon}
          />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={placeholderText}
            placeholderTextColor="#000"
            fontStyle="italic"
            value={searchQuery}
            onChangeText={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 100)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearIcon}>
              <Entypo name="circle-with-cross" size={20} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* If the user is typing and we have suggestions, show them */}
      {/* Otherwise, show either no results or recents + trending */}
      <ScrollView
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        {/* Show suggestions if there are any and user is focused */}
        {isFocused && suggestions.length > 0 && (
          <View style={styles.suggestionsList}>
            {suggestions.map((item, index) =>
              renderSuggestionItem(item, index),
            )}
          </View>
        )}

        {/* No results found scenario */}
        {searchQuery.length > 0 && suggestions.length === 0 && !loading && (
          <View style={styles.noResultsContainer}>
            <MaterialIcons name="search-off" size={45} color="#000" />
            <Text style={styles.noResultsText}>No results found</Text>
            <Text style={styles.noResultsSubText}>
              We couldn't find what you were looking for. Please check your
              keywords again!
            </Text>
            <View
              style={[styles.horizontalLine, {width: screenWidth, height: 8}]}
            />
            <View style={styles.trendingSearchesContainer}>
              <Text style={styles.sectionTitle}>Trending searches</Text>
              <View style={styles.trendingItemsContainer}>
                {renderTrendingSearches()}
              </View>
            </View>
          </View>
        )}

        {/* Show Recents + Trending only when there's no search query 
            or no suggestions (i.e., user hasn't typed or has cleared the input) */}
        {!searchQuery && suggestions.length === 0 && (
          <View style={styles.searchSuggestionsContainer}>
            {/* Recent Searches */}
            <View style={styles.recentSearchesContainer}>
              <Text style={styles.sectionTitle}>Recents</Text>
              {recentSearches.map((item, index) =>
                renderRecentSearchItem(item, index),
              )}
            </View>

            <View
              style={[styles.horizontalLine, {width: screenWidth, height: 8}]}
            />

            {/* Trending */}
            <View style={styles.trendingSearchesContainer}>
              <Text style={styles.sectionTitle}>Trending searches</Text>
              <View style={styles.trendingItemsContainer}>
                {renderTrendingSearches()}
              </View>
            </View>
          </View>
        )}

        {/* Display loading indicator at the bottom if loading */}
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
  );
};

export default SearchItem;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  recentIcon: {
    padding: 5,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
  },
  container: {
    width: '100%',
    backgroundColor: '#fff',
  },
  noResultsContainer: {
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  loadingAnimation: {
    width: '100%',
    height: 100,
  },
  noResultsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555555',
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#777777',
    textAlign: 'center',
    marginVertical: 20,
    padding: 6,
  },
  horizontalLine: {
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  clearIcon: {
    position: 'absolute',
    right: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    margin: 10,
  },
  icon: {
    paddingLeft: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingLeft: 10,
    color: '#1D2951',
    fontWeight: '600',
    fontSize: 14,
  },
  searchSuggestionsContainer: {
    marginTop: 15,
  },
  recentSearchesContainer: {
    marginBottom: 15,
    padding: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
    color: '#000',
  },
  recentItem: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 10,
  },
  recentText: {
    color: '#000',
    alignSelf: 'center',
  },
  trendingSearchesContainer: {
    marginBottom: 15,
    padding: 10,
  },
  trendingItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  trendingItem: {
    padding: 10,
    borderRadius: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
  },
  trendingText: {
    color: '#000',
  },
  suggestionsList: {
    marginTop: 5,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionImage: {
    width: 70,
    height: 65,
    borderRadius: 5,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  SuggestionText: {
    color: '#1D2951',
    fontWeight: '500',
    fontSize: 16,
  },
  SuggestionDescription: {
    fontSize: 12,
    color: '#4a4a4a',
  },
});
