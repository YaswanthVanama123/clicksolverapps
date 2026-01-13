import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import useUserStore from '../../store/userStore';
import {useTheme} from '../../context/ThemeContext';

/**
 * QuickBookPreferences Screen
 * Allows users to configure their quick booking preferences
 */
const QuickBookPreferences = () => {
  const navigation = useNavigation();
  const {isDarkMode} = useTheme();
  const styles = dynamicStyles(isDarkMode);

  const {
    savedAddresses,
    preferences,
    recentServices,
    updateQuickBookPreferences,
    setDefaultTip,
    setDefaultAddress,
    getDefaultAddress,
  } = useUserStore();

  const [loading, setLoading] = useState(false);
  const [quickBookEnabled, setQuickBookEnabled] = useState(true);
  const [defaultTipAmount, setDefaultTipAmount] = useState('0');
  const [autoApplyOffers, setAutoApplyOffers] = useState(true);
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  const defaultAddress = getDefaultAddress();

  useEffect(() => {
    // Load existing preferences
    if (preferences.quickBook) {
      setQuickBookEnabled(preferences.quickBook.enabled !== false);
      setAutoApplyOffers(preferences.quickBook.autoApplyOffers !== false);
      setConfirmationRequired(preferences.quickBook.confirmationRequired === true);
    }
    if (preferences.defaultTip) {
      setDefaultTipAmount(preferences.defaultTip.toString());
    }
  }, [preferences]);

  const handleSavePreferences = async () => {
    setLoading(true);

    try {
      // Update quick book preferences
      const quickBookResult = await updateQuickBookPreferences({
        enabled: quickBookEnabled,
        autoApplyOffers,
        confirmationRequired,
      });

      // Update default tip
      const tipAmount = parseFloat(defaultTipAmount) || 0;
      const tipResult = await setDefaultTip(tipAmount);

      if (quickBookResult.success && tipResult.success) {
        Alert.alert(
          'Success',
          'Your quick book preferences have been saved.',
          [{text: 'OK'}],
        );
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Failed to save preferences. Please try again.',
        [{text: 'OK'}],
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    navigation.navigate('Profile', {screen: 'Addresses'});
  };

  const handleSetDefaultAddress = (address) => {
    Alert.alert(
      'Set Default Address',
      `Set "${address.label || address.area}" as your default address for quick booking?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Set as Default',
          onPress: async () => {
            const result = await setDefaultAddress(address.id);
            if (result.success) {
              Alert.alert('Success', 'Default address updated');
            }
          },
        },
      ],
    );
  };

  const renderAddressCard = (address) => {
    const isDefault = address.isDefault;

    return (
      <TouchableOpacity
        key={address.id}
        style={[styles.addressCard, isDefault && styles.defaultAddressCard]}
        onPress={() => !isDefault && handleSetDefaultAddress(address)}>
        <View style={styles.addressHeader}>
          <Icon
            name="location"
            size={24}
            color={isDefault ? '#667eea' : isDarkMode ? '#FFFFFF' : '#333333'}
          />
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>
              {address.label || 'Address'}
            </Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {address.area}, {address.city}, {address.pincode}
            </Text>
          </View>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecentServiceCard = (service) => {
    const gradientColors = service.gradientColors || ['#667eea', '#764ba2'];

    return (
      <View key={service.id} style={styles.serviceCard}>
        <LinearGradient
          colors={gradientColors}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.serviceGradient}>
          <MaterialCommunityIcons
            name={service.icon || 'flash'}
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.serviceName} numberOfLines={1}>
            {service.name}
          </Text>
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon
            name="arrow-back"
            size={24}
            color={isDarkMode ? '#FFFFFF' : '#333333'}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Book Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Quick Book Toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon
              name="flash"
              size={24}
              color={isDarkMode ? '#FFFFFF' : '#333333'}
            />
            <Text style={styles.sectionTitle}>Quick Book</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Quick Book</Text>
              <Text style={styles.settingDescription}>
                Book services instantly with one tap
              </Text>
            </View>
            <Switch
              value={quickBookEnabled}
              onValueChange={setQuickBookEnabled}
              trackColor={{false: '#767577', true: '#667eea'}}
              thumbColor={quickBookEnabled ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Default Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon
              name="location"
              size={24}
              color={isDarkMode ? '#FFFFFF' : '#333333'}
            />
            <Text style={styles.sectionTitle}>Default Address</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Your default address will be used for quick bookings
          </Text>

          {savedAddresses.length > 0 ? (
            <View style={styles.addressList}>
              {savedAddresses.map(renderAddressCard)}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={handleAddAddress}>
              <Icon name="add-circle-outline" size={24} color="#667eea" />
              <Text style={styles.addAddressText}>Add Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Default Tip */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="cash"
              size={24}
              color={isDarkMode ? '#FFFFFF' : '#333333'}
            />
            <Text style={styles.sectionTitle}>Default Tip</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Set a default tip amount for quick bookings
          </Text>
          <View style={styles.tipInputContainer}>
            <Text style={styles.currencySymbol}>Rs</Text>
            <TextInput
              style={styles.tipInput}
              value={defaultTipAmount}
              onChangeText={setDefaultTipAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={isDarkMode ? '#666666' : '#CCCCCC'}
            />
          </View>
          <View style={styles.tipPresets}>
            {[0, 10, 20, 50].map(amount => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.tipPresetButton,
                  defaultTipAmount === amount.toString() &&
                    styles.tipPresetButtonActive,
                ]}
                onPress={() => setDefaultTipAmount(amount.toString())}>
                <Text
                  style={[
                    styles.tipPresetText,
                    defaultTipAmount === amount.toString() &&
                      styles.tipPresetTextActive,
                  ]}>
                  Rs {amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Auto-Apply Offers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="tag"
              size={24}
              color={isDarkMode ? '#FFFFFF' : '#333333'}
            />
            <Text style={styles.sectionTitle}>Offers</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Apply Best Offer</Text>
              <Text style={styles.settingDescription}>
                Automatically apply the best available discount
              </Text>
            </View>
            <Switch
              value={autoApplyOffers}
              onValueChange={setAutoApplyOffers}
              trackColor={{false: '#767577', true: '#667eea'}}
              thumbColor={autoApplyOffers ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Confirmation */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Confirmation</Text>
              <Text style={styles.settingDescription}>
                Show confirmation dialog before booking
              </Text>
            </View>
            <Switch
              value={confirmationRequired}
              onValueChange={setConfirmationRequired}
              trackColor={{false: '#767577', true: '#667eea'}}
              thumbColor={confirmationRequired ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Recent Services */}
        {recentServices.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon
                name="time"
                size={24}
                color={isDarkMode ? '#FFFFFF' : '#333333'}
              />
              <Text style={styles.sectionTitle}>
                Recent Services ({recentServices.length}/5)
              </Text>
            </View>
            <Text style={styles.sectionDescription}>
              Quick book buttons will appear for these services on your home
              screen
            </Text>
            <View style={styles.servicesList}>
              {recentServices.map(renderRecentServiceCard)}
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSavePreferences}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Preferences</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1a1a1a' : '#F5F5F5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDarkMode ? '#2a2a2a' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333333' : '#E0E0E0',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#333333',
    },
    headerSpacer: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    section: {
      backgroundColor: isDarkMode ? '#2a2a2a' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#333333',
      marginLeft: 8,
    },
    sectionDescription: {
      fontSize: 14,
      color: isDarkMode ? '#AAAAAA' : '#666666',
      marginBottom: 16,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    settingInfo: {
      flex: 1,
      marginRight: 16,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#333333',
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 13,
      color: isDarkMode ? '#AAAAAA' : '#666666',
    },
    addressList: {
      marginTop: 8,
    },
    addressCard: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#444444' : '#E0E0E0',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    defaultAddressCard: {
      borderColor: '#667eea',
      borderWidth: 2,
      backgroundColor: isDarkMode ? '#2a2a40' : '#F0F0FF',
    },
    addressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addressInfo: {
      flex: 1,
      marginLeft: 12,
    },
    addressLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#333333',
      marginBottom: 4,
    },
    addressText: {
      fontSize: 14,
      color: isDarkMode ? '#AAAAAA' : '#666666',
    },
    defaultBadge: {
      backgroundColor: '#667eea',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    defaultBadgeText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    addAddressButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderWidth: 2,
      borderColor: '#667eea',
      borderStyle: 'dashed',
      borderRadius: 8,
      marginTop: 8,
    },
    addAddressText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#667eea',
      marginLeft: 8,
    },
    tipInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#444444' : '#E0E0E0',
      borderRadius: 8,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    currencySymbol: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#333333',
      marginRight: 8,
    },
    tipInput: {
      flex: 1,
      fontSize: 18,
      color: isDarkMode ? '#FFFFFF' : '#333333',
      paddingVertical: 12,
    },
    tipPresets: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    tipPresetButton: {
      flex: 1,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#444444' : '#E0E0E0',
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    tipPresetButtonActive: {
      backgroundColor: '#667eea',
      borderColor: '#667eea',
    },
    tipPresetText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#AAAAAA' : '#666666',
    },
    tipPresetTextActive: {
      color: '#FFFFFF',
    },
    servicesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    serviceCard: {
      width: '30%',
      marginRight: '3.33%',
      marginBottom: 12,
      borderRadius: 8,
      overflow: 'hidden',
    },
    serviceGradient: {
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 80,
    },
    serviceName: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
      marginTop: 8,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#667eea',
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 16,
    },
    saveButtonDisabled: {
      backgroundColor: '#AAAAAA',
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginLeft: 8,
    },
  });

export default QuickBookPreferences;
