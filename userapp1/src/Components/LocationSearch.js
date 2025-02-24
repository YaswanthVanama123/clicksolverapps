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
  useWindowDimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Places } from 'ola-maps';

const placesClient = new Places('iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT');

const LocationSearch = () => {
  const { width } = useWindowDimensions();
  const styles = dynamicStyles(width);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [serviceArray, setServiceArray] = useState([]);
  const route = useRoute();
  const navigation = useNavigation();
  
  // Extract serviceName, savings, tipAmount from route.params
  const { serviceName, savings, tipAmount } = route.params || {};
  const inputRef = useRef(null);

  // 1) Places Autocomplete
  const fetchAndSetPlaceDetails = useCallback(async (searchQuery) => {
    try {
      setLoadingSuggestions(true);
      const response = await placesClient.autocomplete(searchQuery);
      if (response?.body?.predictions) {
        const places = response.body.predictions.map((place) => ({
          id: place.place_id,
          title: place.structured_formatting.main_text,
          address: place.structured_formatting.secondary_text,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        }));
        setSuggestions(places);
      }
    } catch (error) {
      console.error('Failed to fetch place details:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  // 2) When a suggestion is pressed, pass all keys (including savings and tipAmount)
  const handleSuggestionPress = useCallback(
    (item) => {
      setQuery(item.title);
      navigation.replace('UserLocation', { serviceName, savings, tipAmount, suggestion: item });
      setSuggestions([]);
    },
    [navigation, serviceName, savings, tipAmount],
  );

  // 3) Handle hardware back: pass savings and tipAmount too
  const onBackPress = () => {
    navigation.replace('UserLocation', { serviceName, savings, tipAmount });
  };

  useFocusEffect(
    useCallback(() => {
      const handleHardwareBack = () => {
        onBackPress();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
      return () => BackHandler.removeEventListener('hardwareBackPress', handleHardwareBack);
    }, [navigation, serviceName, savings, tipAmount]),
  );

  // 4) Fetch suggestions when query changes
  useEffect(() => {
    if (query.length > 0) {
      fetchAndSetPlaceDetails(query);
    } else {
      setSuggestions([]);
    }
  }, [query, fetchAndSetPlaceDetails]);

  // 5) Store serviceName in state if available
  useEffect(() => {
    if (serviceName) {
      setServiceArray(serviceName);
    }
  }, [serviceName]);

  // 6) Auto-focus the search input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 7) Render suggestion item
  const renderItem = useCallback(
    ({ item }) => (
      <TouchableOpacity style={styles.item} onPress={() => handleSuggestionPress(item)}>
        <View style={styles.iconContainer}>
          <Icon name="location-on" size={24} color="#6e6e6e" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.address}>{item.address}</Text>
        </View>
        <TouchableOpacity>
          <Icon name="favorite-border" size={24} color="#6e6e6e" />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [handleSuggestionPress],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed top search bar */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onBackPress} style={styles.backIcon}>
          <FontAwesome6 name="arrow-left-long" size={18} color="gray" />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search location..."
          placeholderTextColor="#1D2951"
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Entypo name="cross" size={18} color="#4a4a4a" />
          </TouchableOpacity>
        )}
      </View>
      {/* Suggestions or loader */}
      {loadingSuggestions ? (
        <ActivityIndicator size="large" color="#FF5722" style={styles.loader} />
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          style={styles.suggestionsList}
        />
      )}
    </SafeAreaView>
  );
};

function dynamicStyles(width) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isTablet ? 20 : 15,
      paddingVertical: isTablet ? 12 : 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      backgroundColor: '#fff',
    },
    backIcon: {
      marginRight: isTablet ? 15 : 10,
    },
    searchInput: {
      flex: 1,
      padding: 8,
      fontSize: isTablet ? 16 : 14,
      color: '#1D2951',
      backgroundColor: '#f9f9f9',
      borderRadius: 8,
      marginRight: isTablet ? 12 : 10,
    },
    loader: {
      marginTop: isTablet ? 40 : 20,
      alignSelf: 'center',
    },
    suggestionsList: {
      flex: 1,
    },
    listContainer: {
      paddingBottom: 20,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: isTablet ? 14 : 12,
      paddingHorizontal: isTablet ? 20 : 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    iconContainer: {
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      marginBottom: 2,
      color: '#212121',
    },
    address: {
      fontSize: isTablet ? 14 : 12,
      color: '#4a4a4a',
    },
  });
}

export default LocationSearch;
