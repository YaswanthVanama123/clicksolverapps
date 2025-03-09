import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  BackHandler,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Places } from 'ola-maps';
import { useTheme } from '../context/ThemeContext'; // Import theme context for Dark Mode

const placesClient = new Places('iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT');

const LocationSearch = () => {
  // 1) Grab screen dimensions
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme(); // Get Dark Mode status
  const styles = dynamicStyles(width, isDarkMode);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [serviceArray, setServiceArray] = useState([]);
  
  const route = useRoute();
  const navigation = useNavigation();
  const inputRef = useRef(null);

  // Destructure route params
  const { serviceName, savings, tipAmount } = route.params;

  // Autocomplete function (debounced)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        setNoResults(false);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const response = await placesClient.autocomplete(query);
        if (response?.body?.predictions?.length) {
          const places = response.body.predictions.map((place) => ({
            id: place.place_id,
            title: place.structured_formatting.main_text,
            address: place.structured_formatting.secondary_text,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          }));
          setSuggestions(places);
          setNoResults(false);
        } else {
          setSuggestions([]);
          setNoResults(true);
        }
      } catch (error) {
        console.error('Failed to fetch place details:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const delaySearch = setTimeout(fetchSuggestions, 300); // Debounce to reduce API calls
    return () => clearTimeout(delaySearch);
  }, [query]);

  // Navigate back to UserLocation including savings and tipAmount
  const goBackToUserLocation = useCallback(
    (extraParams = {}) => {
      navigation.replace('UserLocation', {
        serviceName,
        savings,
        tipAmount,
        ...extraParams,
      });
    },
    [navigation, serviceName, savings, tipAmount]
  );

  // On back press
  useFocusEffect(
    useCallback(() => {
      const handleBackPress = () => {
        goBackToUserLocation();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    }, [goBackToUserLocation])
  );

  // Store the service name if available
  useEffect(() => {
    if (serviceName) {
      setServiceArray(serviceName);
    }
  }, [serviceName]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // On suggestion press
  const handleSuggestionPress = useCallback(
    (item) => {
      setQuery(item.title);
      goBackToUserLocation({ suggestion: item });
      setSuggestions([]);
    },
    [goBackToUserLocation]
  );

  // Render suggestion item
  const renderItem = useCallback(
    ({ item }) => (
      <TouchableOpacity style={styles.item} onPress={() => handleSuggestionPress(item)}>
        <View style={styles.iconContainer}>
          <Icon name="location-on" size={24} color={isDarkMode ? '#bbb' : '#6e6e6e'} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.address}>{item.address}</Text>
        </View>
        <TouchableOpacity>
          <Icon name="favorite-border" size={24} color={isDarkMode ? '#bbb' : '#6e6e6e'} />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [handleSuggestionPress]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={goBackToUserLocation}>
          <FontAwesome6 name="arrow-left-long" size={18} color={isDarkMode ? '#fff' : 'gray'} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search for a location..."
          placeholderTextColor={isDarkMode ? '#ccc' : '#1D2951'}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Entypo name="cross" size={18} color={isDarkMode ? '#ccc' : '#4a4a4a'} />
          </TouchableOpacity>
        )}
      </View>

      {loadingSuggestions ? (
        <ActivityIndicator size="large" color="#FF5722" style={styles.loader} />
      ) : noResults ? (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>No locations found</Text>
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
};

/* -------------- Dynamic Styles (Dark Mode) -------------- */
function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: isTablet ? 24 : 16,
      paddingHorizontal: isTablet ? 16 : 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333' : '#ddd',
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#333' : '#f9f9f9',
    },
    searchInput: {
      flex: 1,
      padding: 8,
      paddingLeft: 15,
      fontSize: isTablet ? 17 : 15,
      color: isDarkMode ? '#fff' : '#1D2951',
      fontFamily: 'RobotoSlab-Medium',
    },
    list: {
      paddingHorizontal: isTablet ? 24 : 16,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: isTablet ? 14 : 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#444' : '#f0f0f0',
    },
    iconContainer: {
      marginRight: isTablet ? 14 : 12,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: isTablet ? 17 : 15,
      fontFamily: 'RobotoSlab-SemiBold',
      color: isDarkMode ? '#fff' : '#212121',
    },
    address: {
      fontSize: isTablet ? 15 : 14,
      color: isDarkMode ? '#bbb' : '#4a4a4a',
      fontFamily: 'RobotoSlab-Regular',
    },
    loader: {
      marginTop: 20,
      alignSelf: 'center',
    },
    noResults: {
      alignItems: 'center',
      marginTop: 20,
    },
    noResultsText: {
      color: isDarkMode ? '#bbb' : '#777',
      fontSize: 16,
    },
  });
}

export default LocationSearch;
