import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {Places} from 'ola-maps'; // Import the Places module from ola-maps

const placesClient = new Places('iN1RT7PQ41Z0DVxin6jlf7xZbmbIZPtb9CyNwtlT'); // Initialize the Places client with your API key

const LocationSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [serviceArray, setServiceArray] = useState([]);
  const route = useRoute();
  const navigation = useNavigation();
  const {serviceName} = route.params;
  const inputRef = useRef(null);

  // Fetch and set place details using ola-maps Places client
  const fetchAndSetPlaceDetails = useCallback(async query => {
    try {
      // Use the ola-maps Places client to get autocomplete results
      const response = await placesClient.autocomplete(query);

      if (response && response.body && response.body.predictions) {
        const places = response.body.predictions.map(place => ({
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
    }
  }, []);

  const onBackPress = () => {
    navigation.replace('UserLocation', {serviceName});
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.replace('UserLocation', {serviceName});
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  useEffect(() => {
    if (query.length > 0) {
      fetchAndSetPlaceDetails(query);
    } else {
      setSuggestions([]);
    }
  }, [query, fetchAndSetPlaceDetails]);

  useEffect(() => {
    if (serviceName) {
      setServiceArray(serviceName);
    }
  }, [serviceName]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSuggestionPress = useCallback(
    item => {
      setQuery(item.title);
      navigation.replace('UserLocation', {serviceName, suggestion: item});
      setSuggestions([]);
    },
    [navigation, serviceName],
  );

  const renderItem = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleSuggestionPress(item)}>
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
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={onBackPress}>
          <FontAwesome6 name="arrow-left-long" size={18} color="gray" />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search..."
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

      <FlatList
        data={suggestions}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#1D2951',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  searchInput: {
    flex: 1,
    padding: 8,
    paddingLeft: 15,
    fontSize: 15,
    color: '#1D2951',
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#212121',
  },
  address: {
    fontSize: 14,
    color: '#4a4a4a',
  },
});

export default LocationSearch;
