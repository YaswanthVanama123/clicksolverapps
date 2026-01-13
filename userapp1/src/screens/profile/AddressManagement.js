import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Mapbox from '@rnmapbox/maps';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from 'react-i18next';
import useUserStore from '../../store/userStore';
import useLocation from '../../hooks/useLocation';
import AddressCard from '../../components/molecules/AddressCard';
import EmptyState from '../../components/molecules/EmptyState';
import LoadingState from '../../components/molecules/LoadingState';
import AddressService from '../../api/services/address.service';

const {width, height} = Dimensions.get('window');

// Geofence polygons from userLocation.js
const polygonGeofences = [
  {
    id: 'zone1',
    coordinates: [
      [17.006761409194525, 80.53093335197622],
      [17.005373260064985, 80.53291176992008],
      [16.998813039026402, 80.52664649280518],
      [16.993702747389463, 80.52215964720267],
      [16.98846563857974, 80.5205112174242],
      [16.985436512096513, 80.52097340481015],
      [16.982407772736835, 80.51886205401541],
      [16.987520443064497, 80.51325397397363],
      [16.99023324951544, 80.51463921162184],
      [16.995343035509578, 80.51463907310551],
      [16.997739960285273, 80.5172774280341],
      [16.998812144956858, 80.5151667160207],
      [17.001713715885202, 80.51609017256038],
      [17.002827038610846, 80.51776432647671],
      [17.003291715895045, 80.52011454583169],
      [17.00505854929827, 80.52875703518436],
      [17.00682448638898, 80.5309333429243],
      [17.006761409194525, 80.53093335197622],
    ],
  },
  {
    id: 'zone2',
    coordinates: [
      [16.743659016732067, 81.08236641250511],
      [16.74034916284056, 81.1094786505995],
      [16.75332517520627, 81.11236934565574],
      [16.75189061713202, 81.12344773457119],
      [16.74132482137297, 81.13930188707656],
      [16.738499354073056, 81.14316076908437],
      [16.727924964128718, 81.14435289187736],
      [16.72342039833586, 81.14527321552549],
      [16.714353330434236, 81.14475480852309],
      [16.703383261743355, 81.13502168775335],
      [16.696706590762375, 81.11606570973981],
      [16.690277614635917, 81.11161284859327],
      [16.690514707521203, 81.10219147444412],
      [16.682222407654322, 81.09411194809388],
      [16.680443872924542, 81.08526753004003],
      [16.681096564850336, 81.08063131598783],
      [16.68719744307066, 81.07017793961404],
      [16.70130255228827, 81.06808977263063],
      [16.696116367178703, 81.04868074812543],
      [16.712614628885774, 81.05789409014807],
      [16.730789178638346, 81.06475183815792],
      [16.74056558441238, 81.0761195443987],
      [16.743659016732067, 81.08236641250511],
    ],
  },
  {
    id: 'zone3',
    coordinates: [
      [16.67255137959924, 81.03321330178159],
      [16.6824145262823, 81.04647950748898],
      [16.6901906618056, 81.05994340182195],
      [16.694552978963202, 81.06568533268029],
      [16.677859504990124, 81.07340809687918],
      [16.681463988530027, 81.09657586209278],
      [16.68506890661233, 81.11340498431895],
      [16.68392977309564, 81.12271419996296],
      [16.68750736693913, 81.13547809505661],
      [16.689781680226105, 81.14855623455043],
      [16.701923001073155, 81.14795977957687],
      [16.710268916909044, 81.13191111175911],
      [16.710459773455327, 81.13230954617364],
      [16.715581889330167, 81.14954722240287],
      [16.734167808346427, 81.14736380596997],
      [16.749717375531958, 81.14795614271736],
      [16.753503098884124, 81.12557160723918],
      [16.75689984714704, 81.10200134965078],
      [16.739837869176796, 81.07013329316601],
      [16.719937818724915, 81.05944242728924],
      [16.707614321072228, 81.04677046623345],
      [16.707993326270454, 81.0238103387914],
      [16.672526135042432, 81.03270663044418],
    ],
  },
  {
    id: 'zone4',
    coordinates: [
      [17.091730887270444, 80.60650204489468],
      [17.09513456976032, 80.62335172753689],
      [17.109038349803853, 80.63004799391479],
      [17.121936424446076, 80.63527313830275],
      [17.131033832357872, 80.6446897485315],
      [17.13762235049235, 80.62366357630856],
      [17.13463581504783, 80.60368200587993],
    ],
  },
  {
    id: 'gachibowli',
    coordinates: [
      [17.441144863330976, 78.3376254568987],
      [17.428701935872226, 78.35687667241433],
      [17.42800101387249, 78.3767413879973],
      [17.43381411455306, 78.38748327347525],
      [17.445021109810384, 78.40529511275628],
      [17.47106054889956, 78.3945966028669],
      [17.472566887863067, 78.37674057114202],
      [17.467409875390615, 78.35340358285953],
      [17.45496302403113, 78.34790606796042],
      [17.441697955004187, 78.33820169415065],
      [17.441144863330976, 78.3376254568987],
    ],
  },
];

// Ray-casting algorithm to check if a point is in a polygon
const isPointInPolygon = (point, polygon) => {
  const x = point[1];
  const y = point[0];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

const AddressManagement = ({navigation}) => {
  const {isDarkMode} = useTheme();
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  const {savedAddresses, loadAddresses, removeAddress, setDefaultAddress, updateAddress, addAddress, loadingAddresses} =
    useUserStore();
  const {
    getCurrentLocationWithAddress,
    reverseGeocode,
    loading: locationLoading,
  } = useLocation();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    pincode: '',
    label: 'Home',
    name: '',
    phone: '',
    instructions: '',
    latitude: null,
    longitude: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [mapLocation, setMapLocation] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showOutOfServiceModal, setShowOutOfServiceModal] = useState(false);

  const mapRef = useRef(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  }, [loadAddresses]);

  const handleAddNew = () => {
    setEditingAddress(null);
    setFormData({
      addressLine1: '',
      addressLine2: '',
      city: '',
      pincode: '',
      label: 'Home',
      name: '',
      phone: '',
      instructions: '',
      latitude: null,
      longitude: null,
    });
    setFormErrors({});
    setMapLocation(null);
    setShowAddressForm(true);
  };

  const handleEdit = address => {
    setEditingAddress(address);
    setFormData({
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      pincode: address.pincode || '',
      label: address.label || 'Home',
      name: address.name || '',
      phone: address.phone || '',
      instructions: address.instructions || '',
      latitude: address.latitude || null,
      longitude: address.longitude || null,
    });
    setFormErrors({});
    if (address.latitude && address.longitude) {
      setMapLocation([address.longitude, address.latitude]);
    }
    setShowAddressForm(true);
  };

  const handleDelete = addressId => {
    Alert.alert(
      t('delete_address') || 'Delete Address',
      t('delete_address_confirm') ||
        'Are you sure you want to delete this address?',
      [
        {
          text: t('cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await removeAddress(addressId);
            if (result.success) {
              Alert.alert(
                t('success') || 'Success',
                t('address_deleted') || 'Address deleted successfully',
              );
            } else {
              Alert.alert(
                t('error') || 'Error',
                result.error || t('failed_to_delete') || 'Failed to delete address',
              );
            }
          },
        },
      ],
    );
  };

  const handleSetDefault = async addressId => {
    const result = await setDefaultAddress(addressId);
    if (!result.success) {
      Alert.alert(
        t('error') || 'Error',
        result.error || t('failed_to_set_default') || 'Failed to set default address',
      );
    }
  };

  const handleDetectLocation = async () => {
    setMapLoading(true);
    try {
      const locationData = await getCurrentLocationWithAddress();
      if (locationData) {
        setFormData(prev => ({
          ...prev,
          addressLine1: locationData.formattedAddress || '',
          city: locationData.city || '',
          pincode: locationData.pincode || '',
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        }));
        setMapLocation([locationData.longitude, locationData.latitude]);
      }
    } catch (error) {
      Alert.alert(
        t('error') || 'Error',
        t('failed_to_get_location') || 'Failed to get current location',
      );
    } finally {
      setMapLoading(false);
    }
  };

  const handleMapPress = async event => {
    const {geometry} = event;
    const [longitude, latitude] = geometry.coordinates;

    setMapLocation([longitude, latitude]);
    setMapLoading(true);

    try {
      const address = await reverseGeocode(latitude, longitude);
      if (address) {
        setFormData(prev => ({
          ...prev,
          addressLine1: address.formattedAddress || '',
          city: address.city || '',
          pincode: address.pincode || '',
          latitude,
          longitude,
        }));
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    } finally {
      setMapLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.addressLine1.trim()) {
      errors.addressLine1 = t('address_required') || 'Address is required';
    }
    if (!formData.city.trim()) {
      errors.city = t('city_required') || 'City is required';
    }
    if (!formData.pincode.trim()) {
      errors.pincode = t('pincode_required') || 'Pincode is required';
    }
    if (!formData.name.trim()) {
      errors.name = t('name_required') || 'Name is required';
    }
    if (!formData.phone.trim()) {
      errors.phone = t('phone_required') || 'Phone is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = t('phone_invalid') || 'Phone must be 10 digits';
    }
    if (!formData.latitude || !formData.longitude) {
      errors.location = t('location_required') || 'Please select location on map';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkGeofence = () => {
    if (!formData.latitude || !formData.longitude) return false;

    const point = [formData.latitude, formData.longitude];
    const inAnyGeofence = polygonGeofences.some(fence =>
      isPointInPolygon(point, fence.coordinates),
    );

    return inAnyGeofence;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    // Check geofence
    if (!checkGeofence()) {
      setShowOutOfServiceModal(true);
      return;
    }

    setSaving(true);

    try {
      let result;
      if (editingAddress) {
        result = await updateAddress(editingAddress.id, formData);
      } else {
        result = await addAddress(formData);
      }

      if (result.success) {
        setShowAddressForm(false);
        Alert.alert(
          t('success') || 'Success',
          editingAddress
            ? t('address_updated') || 'Address updated successfully'
            : t('address_added') || 'Address added successfully',
        );
      } else {
        Alert.alert(
          t('error') || 'Error',
          result.error ||
            (editingAddress
              ? t('failed_to_update') || 'Failed to update address'
              : t('failed_to_add') || 'Failed to add address'),
        );
      }
    } catch (error) {
      Alert.alert(
        t('error') || 'Error',
        t('something_went_wrong') || 'Something went wrong',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemindMe = async () => {
    try {
      await AddressService.sendServiceReminder({
        city: formData.city,
        area: formData.addressLine1,
        coordinates: {
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
      });
      setShowOutOfServiceModal(false);
      Alert.alert(
        t('success') || 'Success',
        t('reminder_set') || 'We will notify you when service is available in your area',
      );
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  };

  const renderAddressCard = ({item}) => (
    <AddressCard
      address={item}
      onPress={() => handleEdit(item)}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSetDefault={handleSetDefault}
      showActions={true}
    />
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="location-on"
      title={t('no_addresses') || 'No Addresses'}
      message={
        t('no_addresses_message') ||
        'You have not added any addresses yet. Add your first address to get started.'
      }
    />
  );

  if (loadingAddresses && savedAddresses.length === 0) {
    return <LoadingState message={t('loading_addresses') || 'Loading addresses...'} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('my_addresses') || 'My Addresses'}</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {/* Address List */}
      <FlatList
        data={savedAddresses}
        renderItem={renderAddressCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddNew} activeOpacity={0.8}>
        <LinearGradient
          colors={['#FF6B35', '#F7931E']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.fabGradient}>
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Address Form Modal */}
      <Modal visible={showAddressForm} animationType="slide" onRequestClose={() => setShowAddressForm(false)}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddressForm(false)}>
              <MaterialIcons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#212121'} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingAddress ? t('edit_address') || 'Edit Address' : t('add_address') || 'Add Address'}
            </Text>
            <View style={{width: 24}} />
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Auto-detect Location Button */}
            <TouchableOpacity
              style={styles.detectButton}
              onPress={handleDetectLocation}
              disabled={mapLoading || locationLoading}>
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.detectButtonGradient}>
                {mapLoading || locationLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="my-location" size={20} color="#FFFFFF" />
                    <Text style={styles.detectButtonText}>
                      {t('use_current_location') || 'Use Current Location'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Map */}
            <View style={styles.mapContainer}>
              <Mapbox.MapView
                ref={mapRef}
                style={styles.map}
                styleURL="mapbox://styles/mapbox/streets-v11"
                onPress={handleMapPress}>
                {mapLocation && (
                  <>
                    <Mapbox.Camera zoomLevel={16} centerCoordinate={mapLocation} />
                    <Mapbox.PointAnnotation id="selectedLocation" coordinate={mapLocation}>
                      <View style={styles.markerContainer}>
                        <MaterialIcons name="location-on" size={40} color="#FF6B35" />
                      </View>
                    </Mapbox.PointAnnotation>
                  </>
                )}
              </Mapbox.MapView>
              {mapLoading && (
                <View style={styles.mapLoadingOverlay}>
                  <ActivityIndicator size="large" color="#FF6B35" />
                </View>
              )}
              <Text style={styles.mapHint}>{t('tap_map_to_select') || 'Tap on map to select location'}</Text>
            </View>
            {formErrors.location && <Text style={styles.errorText}>{formErrors.location}</Text>}

            {/* Form Fields */}
            <View style={styles.formSection}>
              <Text style={styles.label}>{t('address_line_1') || 'Address Line 1'} *</Text>
              <TextInput
                style={[styles.input, formErrors.addressLine1 && styles.inputError]}
                placeholder={t('enter_address') || 'Enter address'}
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                value={formData.addressLine1}
                onChangeText={text => setFormData(prev => ({...prev, addressLine1: text}))}
                multiline
              />
              {formErrors.addressLine1 && <Text style={styles.errorText}>{formErrors.addressLine1}</Text>}

              <Text style={styles.label}>{t('address_line_2') || 'Address Line 2 (Optional)'}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('enter_address_line_2') || 'Apartment, suite, floor, etc.'}
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                value={formData.addressLine2}
                onChangeText={text => setFormData(prev => ({...prev, addressLine2: text}))}
              />

              <Text style={styles.label}>{t('city') || 'City'} *</Text>
              <TextInput
                style={[styles.input, formErrors.city && styles.inputError]}
                placeholder={t('enter_city') || 'Enter city'}
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                value={formData.city}
                onChangeText={text => setFormData(prev => ({...prev, city: text}))}
              />
              {formErrors.city && <Text style={styles.errorText}>{formErrors.city}</Text>}

              <Text style={styles.label}>{t('pincode') || 'Pincode'} *</Text>
              <TextInput
                style={[styles.input, formErrors.pincode && styles.inputError]}
                placeholder={t('enter_pincode') || 'Enter pincode'}
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                value={formData.pincode}
                onChangeText={text => setFormData(prev => ({...prev, pincode: text}))}
                keyboardType="number-pad"
                maxLength={6}
              />
              {formErrors.pincode && <Text style={styles.errorText}>{formErrors.pincode}</Text>}

              <Text style={styles.label}>{t('label') || 'Label'} *</Text>
              <View style={styles.labelSelector}>
                {['Home', 'Work', 'Other'].map(label => (
                  <TouchableOpacity
                    key={label}
                    style={[styles.labelOption, formData.label === label && styles.labelOptionSelected]}
                    onPress={() => setFormData(prev => ({...prev, label}))}>
                    <Text
                      style={[styles.labelOptionText, formData.label === label && styles.labelOptionTextSelected]}>
                      {t(label.toLowerCase()) || label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{t('name_for_delivery') || 'Name (For Delivery)'} *</Text>
              <TextInput
                style={[styles.input, formErrors.name && styles.inputError]}
                placeholder={t('enter_name') || 'Enter name'}
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                value={formData.name}
                onChangeText={text => setFormData(prev => ({...prev, name: text}))}
              />
              {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}

              <Text style={styles.label}>{t('phone') || 'Phone'} *</Text>
              <TextInput
                style={[styles.input, formErrors.phone && styles.inputError]}
                placeholder={t('enter_phone') || 'Enter phone number'}
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                value={formData.phone}
                onChangeText={text => setFormData(prev => ({...prev, phone: text}))}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {formErrors.phone && <Text style={styles.errorText}>{formErrors.phone}</Text>}

              <Text style={styles.label}>{t('instructions') || 'Delivery Instructions (Optional)'}</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder={t('enter_instructions') || 'E.g., Ring the doorbell, Gate code, etc.'}
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                value={formData.instructions}
                onChangeText={text => setFormData(prev => ({...prev, instructions: text}))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.saveButtonGradient}>
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('save_address') || 'Save Address'}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Out of Service Modal */}
      <Modal
        visible={showOutOfServiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOutOfServiceModal(false)}>
        <View style={styles.outOfServiceOverlay}>
          <View style={styles.outOfServiceModal}>
            <MaterialIcons name="location-off" size={60} color="#FF6B35" />
            <Text style={styles.outOfServiceTitle}>
              {t('outside_service_area') || 'Outside Service Area'}
            </Text>
            <Text style={styles.outOfServiceMessage}>
              {t('outside_service_message') ||
                'Sorry, we are not currently servicing this location. Would you like us to notify you when we expand to this area?'}
            </Text>
            <View style={styles.outOfServiceButtons}>
              <TouchableOpacity
                style={styles.outOfServiceButtonSecondary}
                onPress={() => setShowOutOfServiceModal(false)}>
                <Text style={styles.outOfServiceButtonSecondaryText}>{t('cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outOfServiceButtonPrimary} onPress={handleRemindMe}>
                <LinearGradient
                  colors={['#FF6B35', '#F7931E']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.outOfServiceButtonPrimaryGradient}>
                  <Text style={styles.outOfServiceButtonPrimaryText}>{t('remind_me') || 'Remind Me'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#F5F5F5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    headerSpacer: {
      width: 32,
    },
    listContent: {
      paddingVertical: 12,
      flexGrow: 1,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      borderRadius: 30,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    fabGradient: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#E0E0E0',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDarkMode ? '#FFFFFF' : '#212121',
    },
    formContainer: {
      flex: 1,
      padding: 16,
    },
    detectButton: {
      marginBottom: 16,
      borderRadius: 8,
      overflow: 'hidden',
    },
    detectButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 8,
    },
    detectButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    mapContainer: {
      height: 250,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 8,
      position: 'relative',
    },
    map: {
      flex: 1,
    },
    markerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapLoadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    mapHint: {
      position: 'absolute',
      bottom: 8,
      left: 8,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: '#FFFFFF',
      fontSize: 12,
      padding: 8,
      borderRadius: 6,
      textAlign: 'center',
    },
    formSection: {
      marginTop: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#212121',
      marginBottom: 8,
      marginTop: 16,
    },
    input: {
      backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F5F5',
      borderWidth: 1,
      borderColor: isDarkMode ? '#333' : '#E0E0E0',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      color: isDarkMode ? '#FFFFFF' : '#212121',
    },
    inputError: {
      borderColor: '#F44336',
    },
    inputMultiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    errorText: {
      fontSize: 12,
      color: '#F44336',
      marginTop: 4,
    },
    labelSelector: {
      flexDirection: 'row',
      gap: 12,
    },
    labelOption: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333' : '#E0E0E0',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    },
    labelOptionSelected: {
      borderColor: '#FF6B35',
      backgroundColor: isDarkMode ? '#2A1410' : '#FFF4F0',
    },
    labelOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#B0B0B0' : '#616161',
    },
    labelOptionTextSelected: {
      color: '#FF6B35',
    },
    saveButton: {
      marginTop: 24,
      marginBottom: 32,
      borderRadius: 8,
      overflow: 'hidden',
    },
    saveButtonGradient: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    outOfServiceOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    outOfServiceModal: {
      backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      width: '100%',
      maxWidth: 400,
    },
    outOfServiceTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: isDarkMode ? '#FFFFFF' : '#212121',
      marginTop: 16,
      marginBottom: 12,
    },
    outOfServiceMessage: {
      fontSize: 15,
      color: isDarkMode ? '#B0B0B0' : '#616161',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    outOfServiceButtons: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    outOfServiceButtonSecondary: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333' : '#E0E0E0',
      alignItems: 'center',
    },
    outOfServiceButtonSecondaryText: {
      fontSize: 15,
      fontWeight: '600',
      color: isDarkMode ? '#B0B0B0' : '#616161',
    },
    outOfServiceButtonPrimary: {
      flex: 1,
      borderRadius: 8,
      overflow: 'hidden',
    },
    outOfServiceButtonPrimaryGradient: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    outOfServiceButtonPrimaryText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });

export default AddressManagement;
