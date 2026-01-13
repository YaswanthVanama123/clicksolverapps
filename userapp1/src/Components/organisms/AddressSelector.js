/**
 * AddressSelector.js - Organism Component
 * Location picker with multiple options: current location, saved addresses, and search
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {getColors} from '../../theme/colors';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from '@react-native-community/geolocation';

/**
 * AddressSelector Component
 * @param {Function} onSelect - Callback when address is selected
 * @param {Boolean} showCurrentLocation - Show current location option
 * @param {Array} savedAddresses - User's saved addresses
 * @param {Object} selectedAddress - Currently selected address
 * @param {Boolean} showSearch - Show search functionality
 * @param {Boolean} showMap - Show map preview
 */
const AddressSelector = ({
  onSelect,
  showCurrentLocation = true,
  savedAddresses = [],
  selectedAddress = null,
  showSearch = true,
  showMap = false,
}) => {
  const {width} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const styles = dynamicStyles(width, isDarkMode, colors);

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [filteredAddresses, setFilteredAddresses] = useState(savedAddresses);

  // Filter addresses based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAddresses(savedAddresses);
    } else {
      const filtered = savedAddresses.filter(
        address =>
          address.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          address.address?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredAddresses(filtered);
    }
  }, [searchQuery, savedAddresses]);

  // Request location permission
  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  // Get current location
  const handleCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to use this feature',
      );
      return;
    }

    setIsLoadingLocation(true);

    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        const locationData = {
          type: 'current',
          label: 'Current Location',
          latitude,
          longitude,
          address: 'Fetching address...',
        };
        setCurrentLocation(locationData);
        setIsLoadingLocation(false);
        onSelect?.(locationData);
      },
      error => {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Failed to get your current location');
        setIsLoadingLocation(false);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleAddressSelect = address => {
    onSelect?.(address);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <MaterialIcons
            name="search"
            size={20}
            color={colors.text.tertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search saved addresses..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}>
              <MaterialIcons
                name="close"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Current Location Option */}
        {showCurrentLocation && (
          <TouchableOpacity
            style={[
              styles.addressCard,
              selectedAddress?.type === 'current' && styles.addressCardActive,
              isLoadingLocation && styles.addressCardDisabled,
            ]}
            onPress={handleCurrentLocation}
            disabled={isLoadingLocation}>
            <View style={styles.addressIconContainer}>
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <MaterialIcons
                  name="my-location"
                  size={24}
                  color={
                    selectedAddress?.type === 'current'
                      ? colors.primary
                      : colors.text.secondary
                  }
                />
              )}
            </View>

            <View style={styles.addressContent}>
              <Text style={styles.addressLabel}>
                {isLoadingLocation
                  ? 'Getting your location...'
                  : 'Use Current Location'}
              </Text>
              <Text style={styles.addressText}>
                {currentLocation?.address || 'Tap to auto-detect your location'}
              </Text>
            </View>

            {selectedAddress?.type === 'current' && (
              <MaterialIcons
                name="check-circle"
                size={24}
                color={colors.success}
              />
            )}
          </TouchableOpacity>
        )}

        {/* Saved Addresses Section */}
        {filteredAddresses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>
            {filteredAddresses.map((address, index) => (
              <AddressCard
                key={address.id || index}
                address={address}
                isSelected={selectedAddress?.id === address.id}
                onSelect={() => handleAddressSelect(address)}
                colors={colors}
                styles={styles}
              />
            ))}
          </View>
        )}

        {/* No Results */}
        {searchQuery.length > 0 && filteredAddresses.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="search-off"
              size={60}
              color={colors.text.tertiary}
            />
            <Text style={styles.emptyTitle}>No addresses found</Text>
            <Text style={styles.emptySubtitle}>
              Try a different search term
            </Text>
          </View>
        )}

        {/* Add New Address Button */}
        <TouchableOpacity style={styles.addNewCard}>
          <View style={styles.addNewIconContainer}>
            <MaterialIcons
              name="add-location-alt"
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={styles.addNewContent}>
            <Text style={styles.addNewLabel}>Add New Address</Text>
            <Text style={styles.addNewSubtext}>Save a new address</Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={colors.text.tertiary}
          />
        </TouchableOpacity>

        {/* Map Preview (Optional) */}
        {showMap && selectedAddress && (
          <View style={styles.mapPreviewContainer}>
            <Text style={styles.mapPreviewLabel}>Map Preview</Text>
            <View style={styles.mapPlaceholder}>
              <MaterialIcons
                name="map"
                size={48}
                color={colors.text.tertiary}
              />
              <Text style={styles.mapPlaceholderText}>
                Map preview would appear here
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

/**
 * AddressCard - Individual saved address card
 */
const AddressCard = ({address, isSelected, onSelect, colors, styles}) => {
  const getAddressIcon = () => {
    switch (address.type) {
      case 'home':
        return 'home';
      case 'work':
        return 'work';
      case 'other':
        return 'location-on';
      default:
        return 'place';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.addressCard, isSelected && styles.addressCardActive]}
      onPress={onSelect}
      activeOpacity={0.7}>
      <View style={styles.addressIconContainer}>
        <MaterialIcons
          name={getAddressIcon()}
          size={24}
          color={isSelected ? colors.primary : colors.text.secondary}
        />
      </View>

      <View style={styles.addressContent}>
        <View style={styles.addressLabelRow}>
          <Text style={styles.addressLabel}>{address.label}</Text>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
        <Text style={styles.addressText} numberOfLines={2}>
          {address.address}
        </Text>
        {address.landmark && (
          <Text style={styles.addressLandmark}>Near: {address.landmark}</Text>
        )}
      </View>

      <View style={styles.addressActions}>
        {isSelected && (
          <MaterialIcons name="check-circle" size={24} color={colors.success} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const dynamicStyles = (width, isDarkMode, colors) => {
  const isTablet = width >= 768;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Search Bar
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 12,
      height: 48,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text.primary,
      padding: 0,
    },
    clearButton: {
      padding: 4,
    },

    // Scroll View
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },

    // Section
    section: {
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '700',
      color: colors.text.primary,
      marginHorizontal: 16,
      marginVertical: 12,
    },

    // Address Card
    addressCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    addressCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.withOpacity(colors.primary, 0.05),
      elevation: 4,
    },
    addressCardDisabled: {
      opacity: 0.6,
    },
    addressIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDarkMode ? '#2A2A3E' : '#F8F9FA',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    addressContent: {
      flex: 1,
    },
    addressLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    addressLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginRight: 8,
    },
    defaultBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    defaultBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#fff',
    },
    addressText: {
      fontSize: 14,
      color: colors.text.secondary,
      lineHeight: 20,
    },
    addressLandmark: {
      fontSize: 12,
      color: colors.text.tertiary,
      marginTop: 4,
      fontStyle: 'italic',
    },
    addressActions: {
      marginLeft: 8,
    },

    // Add New Card
    addNewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: 'dashed',
    },
    addNewIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.withOpacity(colors.primary, 0.1),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    addNewContent: {
      flex: 1,
    },
    addNewLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 2,
    },
    addNewSubtext: {
      fontSize: 13,
      color: colors.text.secondary,
    },

    // Empty State
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: 'center',
    },

    // Map Preview
    mapPreviewContainer: {
      marginHorizontal: 16,
      marginTop: 16,
    },
    mapPreviewLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 12,
    },
    mapPlaceholder: {
      height: 200,
      backgroundColor: colors.surface,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.divider,
    },
    mapPlaceholderText: {
      fontSize: 14,
      color: colors.text.tertiary,
      marginTop: 8,
    },
  });
};

export default AddressSelector;
