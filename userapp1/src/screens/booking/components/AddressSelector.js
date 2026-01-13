import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../../context/ThemeContext';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import useUserStore from '../../../store/userStore';
import useLocation from '../../../hooks/useLocation';
import AddressCard from '../../molecules/AddressCard';

const AddressSelector = ({
  onSelectAddress,
  selectedAddressId = null,
  showCurrentLocation = true,
  maxAddresses = 4,
}) => {
  const {isDarkMode} = useTheme();
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();
  const navigation = useNavigation();

  const {savedAddresses, loadAddresses, getDefaultAddress, loadingAddresses} =
    useUserStore();
  const {
    getCurrentLocationWithAddress,
    loading: locationLoading,
  } = useLocation();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    if (selectedAddressId) {
      const address = savedAddresses.find(addr => addr.id === selectedAddressId);
      if (address) {
        setSelectedAddress(address);
      }
    } else if (savedAddresses.length > 0) {
      // Auto-select default address if no address is selected
      const defaultAddress = getDefaultAddress();
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
        onSelectAddress?.(defaultAddress);
      }
    }
  }, [selectedAddressId, savedAddresses]);

  const handleUseCurrentLocation = async () => {
    setDetectingLocation(true);
    try {
      const locationData = await getCurrentLocationWithAddress();
      if (locationData) {
        const currentLocationAddress = {
          id: 'current',
          label: 'Current Location',
          addressLine1: locationData.formattedAddress || '',
          city: locationData.city || '',
          pincode: locationData.pincode || '',
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          isCurrentLocation: true,
        };
        setSelectedAddress(currentLocationAddress);
        onSelectAddress?.(currentLocationAddress);
      }
    } catch (error) {
      Alert.alert(
        t('error') || 'Error',
        t('failed_to_get_location') || 'Failed to get current location',
      );
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSelectAddress = address => {
    setSelectedAddress(address);
    onSelectAddress?.(address);
  };

  const handleAddNewAddress = () => {
    navigation.navigate('AddressManagement');
  };

  const handleManageAddresses = () => {
    navigation.navigate('AddressManagement');
  };

  const displayedAddresses = savedAddresses.slice(0, maxAddresses);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('select_address') || 'Select Address'}
        </Text>
        {savedAddresses.length > 0 && (
          <TouchableOpacity onPress={handleManageAddresses}>
            <Text style={styles.manageLink}>
              {t('manage') || 'Manage'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Use Current Location Button */}
      {showCurrentLocation && (
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
          disabled={detectingLocation || locationLoading}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.currentLocationGradient}>
            {detectingLocation || locationLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="my-location" size={20} color="#FFFFFF" />
                <Text style={styles.currentLocationText}>
                  {t('use_current_location') || 'Use Current Location'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Address List */}
      {loadingAddresses ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FF6B35" />
          <Text style={styles.loadingText}>
            {t('loading_addresses') || 'Loading addresses...'}
          </Text>
        </View>
      ) : savedAddresses.length > 0 ? (
        <View>
          <ScrollView
            horizontal={false}
            showsVerticalScrollIndicator={false}
            style={styles.addressList}>
            {displayedAddresses.map(address => (
              <AddressCard
                key={address.id}
                address={address}
                onPress={() => handleSelectAddress(address)}
                isSelected={selectedAddress?.id === address.id}
                showActions={false}
              />
            ))}
          </ScrollView>

          {savedAddresses.length > maxAddresses && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleManageAddresses}>
              <Text style={styles.viewAllText}>
                {t('view_all_addresses') || `View All ${savedAddresses.length} Addresses`}
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color="#FF6B35" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="location-off"
            size={48}
            color={isDarkMode ? '#666' : '#CCC'}
          />
          <Text style={styles.emptyTitle}>
            {t('no_saved_addresses') || 'No Saved Addresses'}
          </Text>
          <Text style={styles.emptyMessage}>
            {t('no_saved_addresses_message') ||
              'You have not saved any addresses yet'}
          </Text>
        </View>
      )}

      {/* Add New Address Button */}
      <TouchableOpacity
        style={styles.addNewButton}
        onPress={handleAddNewAddress}
        activeOpacity={0.8}>
        <MaterialIcons
          name="add-circle-outline"
          size={20}
          color="#FF6B35"
        />
        <Text style={styles.addNewText}>
          {t('add_new_address') || 'Add New Address'}
        </Text>
      </TouchableOpacity>

      {/* Selected Address Summary */}
      {selectedAddress && (
        <View style={styles.selectedSummary}>
          <View style={styles.selectedSummaryHeader}>
            <MaterialIcons
              name="check-circle"
              size={20}
              color="#4CAF50"
            />
            <Text style={styles.selectedSummaryTitle}>
              {t('selected_address') || 'Selected Address'}
            </Text>
          </View>
          <Text style={styles.selectedSummaryText} numberOfLines={2}>
            {selectedAddress.isCurrentLocation
              ? selectedAddress.addressLine1
              : `${selectedAddress.addressLine1}, ${selectedAddress.city}`}
          </Text>
        </View>
      )}
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDarkMode ? '#FFFFFF' : '#212121',
    },
    manageLink: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FF6B35',
    },
    currentLocationButton: {
      marginBottom: 16,
      borderRadius: 8,
      overflow: 'hidden',
    },
    currentLocationGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 8,
    },
    currentLocationText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: isDarkMode ? '#B0B0B0' : '#616161',
    },
    addressList: {
      maxHeight: 400,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginTop: 8,
      gap: 8,
    },
    viewAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FF6B35',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#212121',
      marginTop: 12,
    },
    emptyMessage: {
      fontSize: 14,
      color: isDarkMode ? '#B0B0B0' : '#616161',
      marginTop: 8,
      textAlign: 'center',
    },
    addNewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginTop: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333' : '#E0E0E0',
      borderStyle: 'dashed',
      gap: 8,
    },
    addNewText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FF6B35',
    },
    selectedSummary: {
      marginTop: 16,
      padding: 12,
      backgroundColor: isDarkMode ? '#0D2818' : '#E8F5E9',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1B5E3F' : '#4CAF50',
    },
    selectedSummaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    selectedSummaryTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: isDarkMode ? '#66BB6A' : '#2E7D32',
    },
    selectedSummaryText: {
      fontSize: 14,
      color: isDarkMode ? '#A5D6A7' : '#1B5E20',
      lineHeight: 20,
    },
  });

export default AddressSelector;
