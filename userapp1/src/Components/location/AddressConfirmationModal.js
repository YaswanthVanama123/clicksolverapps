import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import AddressForm from './AddressForm';

/**
 * AddressConfirmationModal Component
 * Modal for confirming and entering complete address details before booking
 */
const AddressConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  loading,
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
  errors,
  isDarkMode,
}) => {
  const {t} = useTranslation();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.messageBoxBackdrop}>
        <View
          style={[
            styles.messageBox,
            {backgroundColor: isDarkMode ? '#333' : '#fff'},
          ]}>
          {loading ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#FF5722" />
              <Text
                style={[
                  styles.loadingText,
                  {color: isDarkMode ? '#fff' : '#000'},
                ]}>
                {t('fetching_details') || 'Fetching details...'}
              </Text>
            </View>
          ) : (
            <>
              <AddressForm
                city={city}
                setCity={setCity}
                area={area}
                setArea={setArea}
                pincode={pincode}
                setPincode={setPincode}
                alternatePhoneNumber={alternatePhoneNumber}
                setAlternatePhoneNumber={setAlternatePhoneNumber}
                alternateName={alternateName}
                setAlternateName={setAlternateName}
                errors={errors}
                isDarkMode={isDarkMode}
              />

              <TouchableOpacity style={styles.bookButton} onPress={onConfirm}>
                <Text style={styles.bookButtonText}>
                  {t('book_commander') || 'Book Commander'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.closeButton,
                  {backgroundColor: isDarkMode ? '#555' : '#f2f2f2'},
                ]}
                onPress={onClose}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  messageBoxBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  messageBox: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    elevation: 10,
  },
  bookButton: {
    backgroundColor: '#ff4500',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  bookButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
});

export default AddressConfirmationModal;
