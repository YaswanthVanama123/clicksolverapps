import React from 'react';
import {StyleSheet, View, Text, TextInput} from 'react-native';
import {useTranslation} from 'react-i18next';

/**
 * AddressForm Component
 * Form for collecting complete address details (city, area, pincode, phone, name)
 */
const AddressForm = ({
  city,
  setCity,
  area,
  setArea,
  pincode,
  setPincode,
  alternatePhoneNumber,
  setAlternatePhoneNumber,
  alternateName,
  setAlternateName,
  errors = {},
  isDarkMode,
}) => {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.completeAddressHead,
          {color: isDarkMode ? '#fff' : '#1D2951'},
        ]}>
        {t('enter_complete_address') || 'Enter complete address!'}
      </Text>

      {/* City Field */}
      <Text style={[styles.label, {color: isDarkMode ? '#ccc' : '#808080'}]}>
        {t('city') || 'City'}
      </Text>
      <View style={styles.inputView}>
        <TextInput
          style={[styles.input, {color: isDarkMode ? '#fff' : '#000'}]}
          placeholder={t('city_placeholder') || 'City'}
          placeholderTextColor={isDarkMode ? '#aaa' : '#000'}
          value={city}
          onChangeText={setCity}
        />
        {errors.city ? (
          <Text style={styles.errorText}>{errors.city}</Text>
        ) : null}
      </View>

      {/* Area Field */}
      <Text style={[styles.label, {color: isDarkMode ? '#ccc' : '#808080'}]}>
        {t('area') || 'Area'}
      </Text>
      <View style={styles.inputView}>
        <TextInput
          style={[styles.input, {color: isDarkMode ? '#fff' : '#000'}]}
          placeholder={t('area_placeholder') || 'Area'}
          placeholderTextColor={isDarkMode ? '#aaa' : '#000'}
          value={area}
          onChangeText={setArea}
        />
        {errors.area ? (
          <Text style={styles.errorText}>{errors.area}</Text>
        ) : null}
      </View>

      {/* Pincode Field */}
      <Text style={[styles.label, {color: isDarkMode ? '#ccc' : '#808080'}]}>
        {t('pincode') || 'Pincode'}
      </Text>
      <View style={styles.inputView}>
        <TextInput
          style={[styles.input, {color: isDarkMode ? '#fff' : '#000'}]}
          placeholder={t('pincode_placeholder') || 'Pincode'}
          placeholderTextColor={isDarkMode ? '#aaa' : '#000'}
          value={pincode}
          onChangeText={setPincode}
          keyboardType="numeric"
        />
        {errors.pincode ? (
          <Text style={styles.errorText}>{errors.pincode}</Text>
        ) : null}
      </View>

      {/* Phone Number Field */}
      <Text style={[styles.label, {color: isDarkMode ? '#ccc' : '#808080'}]}>
        {t('phone_number') || 'Phone number'}
      </Text>
      <View style={styles.inputView}>
        <TextInput
          style={[styles.input, {color: isDarkMode ? '#fff' : '#000'}]}
          placeholder={t('alternate_phone') || 'Alternate phone number'}
          placeholderTextColor={isDarkMode ? '#aaa' : '#000'}
          keyboardType="phone-pad"
          value={alternatePhoneNumber}
          onChangeText={setAlternatePhoneNumber}
        />
        {errors.phone ? (
          <Text style={styles.errorText}>{errors.phone}</Text>
        ) : null}
      </View>

      {/* Name Field */}
      <Text style={[styles.label, {color: isDarkMode ? '#ccc' : '#808080'}]}>
        {t('name') || 'Name'}
      </Text>
      <View style={styles.inputView}>
        <TextInput
          style={[styles.input, {color: isDarkMode ? '#fff' : '#000'}]}
          placeholder={t('alternate_name') || 'Alternate name'}
          placeholderTextColor={isDarkMode ? '#aaa' : '#000'}
          value={alternateName}
          onChangeText={setAlternateName}
        />
        {errors.name ? (
          <Text style={styles.errorText}>{errors.name}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  completeAddressHead: {
    fontSize: 18,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    padding: 5,
  },
  inputView: {
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 5,
  },
});

export default AddressForm;
