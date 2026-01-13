import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Modal} from 'react-native';
import {useTranslation} from 'react-i18next';

/**
 * OutOfServiceModal Component
 * Modal shown when user's location is outside service area
 */
const OutOfServiceModal = ({
  visible,
  onClose,
  onRemindMe,
  city,
  isDarkMode,
}) => {
  const {t} = useTranslation();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {backgroundColor: isDarkMode ? '#333' : '#fff'},
          ]}>
          <Text
            style={[
              styles.modalTitle,
              {color: isDarkMode ? '#fff' : '#212121'},
            ]}>
            {t('location_not_serviceable') || 'Location Not Serviceable'}
          </Text>
          <Text
            style={[
              styles.modalMessage,
              {color: isDarkMode ? '#ccc' : '#212121'},
            ]}>
            {t('location_not_available', {
              city: city || t('this') || 'this',
            }) ||
              `We are not in ${city} location. Please choose another location or tap "Remind Me" to get a notification when service is available.`}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              width: '100%',
            }}>
            <TouchableOpacity
              style={[
                styles.modalCancelButton,
                {backgroundColor: isDarkMode ? '#555' : '#f5f5f5'},
              ]}
              onPress={onClose}>
              <Text
                style={[
                  styles.modalCancelButtonText,
                  {color: isDarkMode ? '#fff' : '#9e9e9e'},
                ]}>
                {t('cancel') || 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={onRemindMe}>
              <Text style={styles.modalButtonText}>
                {t('remind_me') || 'Remind Me'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#ff6f00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OutOfServiceModal;
