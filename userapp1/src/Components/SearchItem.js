import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  BackHandler,
  ScrollView,
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
// import Config from 'react-native-config';

const SearchItem = () => {
  const initialPlaceholder = 'Search for ';
  const screenHeight = Dimensions.get('window').height;
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
  const inputRef = useRef(null);

  const navigation = useNavigation();
  const [recentSearches, setRecentSearches] = useState([]);

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

  const storeRecentService = useCallback(async service => {
    try {
      const existingServicesJson = await EncryptedStorage.getItem(
        'recentServices',
      );
      let updatedServices;
      if (existingServicesJson) {
        const existingServices = JSON.parse(existingServicesJson);
        updatedServices = existingServices.filter(
          existingService =>
            existingService.main_service_id !== service.main_service_id,
        );
        updatedServices.push(service);
      } else {
        updatedServices = [service];
      }
      updatedServices = updatedServices.slice(-5);
      await EncryptedStorage.setItem(
        'recentServices',
        JSON.stringify(updatedServices),
      );
    } catch (error) {
      console.error('Error storing recent service:', error);
    }
  }, []);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setSuggestions([]);
    setIsFocused(true);
  }, []);

  const handleServiceClick = useCallback(
    item => {
      storeRecentService(item);
      navigation.push('ServiceBooking', {serviceName: item.service_category});
    },
    [navigation, storeRecentService],
  );

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleServiceClick(item)}>
      <Image source={{uri: item.service_urls}} style={styles.suggestionImage} />
      <View style={styles.textContainer}>
        <Text style={styles.SuggestionText}>{item.service_tag}</Text>
        <Text style={styles.SuggestionDescription} numberOfLines={2}>
          {item.service_details.about}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearches = useCallback(() => {
    if (!Array.isArray(recentSearches)) {
      return null;
    }
    return (
      recentSearches.length > 0 &&
      recentSearches.map(item => (
        <TouchableOpacity
          key={item.main_service_id}
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
      ))
    );
  }, [recentSearches, navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  const handleHome = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
      }),
    );
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []),
  );

  const renderTrendingSearches = useCallback(
    () =>
      trendingSearches.map((item, index) => (
        <TouchableOpacity key={index} style={styles.trendingItem}>
          <Text style={styles.trendingText}>{item}</Text>
        </TouchableOpacity>
      )),
    [trendingSearches],
  );

  return (
    <View style={styles.mainContainer}>
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

      <ScrollView contentContainerStyle={{paddingBottom: 50, flexGrow: 1}}>
        <View
          style={[styles.horizontalLine, {width: screenWidth, height: 4}]}
        />
        {searchQuery && suggestions.length === 0 && (
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

        {loading && (
          <LottieView
            source={require('../assets/searchLoading.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        )}

        {!searchQuery && suggestions.length === 0 && (
          <View style={styles.searchSuggestionsContainer}>
            <View style={styles.recentSearchesContainer}>
              <Text style={styles.sectionTitle}>Recents</Text>
              {renderRecentSearches()}
            </View>
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

        {isFocused && suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            renderItem={renderItem}
            keyExtractor={item => item.main_service_id.toString()}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
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
    display: 'flex',
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
  subText: {
    color: '#777',
    fontSize: 14,
  },
});
