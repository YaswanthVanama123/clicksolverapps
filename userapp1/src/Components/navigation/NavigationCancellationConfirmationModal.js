import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Modal} from 'react-native';
import {useTranslation} from 'react-i18next';
import Entypo from 'react-native-vector-icons/Entypo';

/**
 * NavigationCancellationConfirmationModal Component
 * Confirmation modal before cancelling service on navigation screen
 */
const NavigationCancellationConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  isDarkMode,
  onDismiss,
}) => {
  const {t} = useTranslation();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      onDismiss={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={styles.crossContainer}>
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.backButtonContainer,
              {backgroundColor: isDarkMode ? '#333' : 'white'},
            ]}>
            <Entypo name="cross" size={20} color={isDarkMode ? '#fff' : 'black'} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.confirmationModalContainer,
            {backgroundColor: isDarkMode ? '#333' : 'white'},
          ]}>
          <Text
            style={[
              styles.confirmationTitle,
              {
                color: isDarkMode ? '#fff' : '#000',
                borderBottomColor: isDarkMode ? '#555' : '#eee',
              },
            ]}>
            {t('confirmation_title') ||
              'Are you sure you want to cancel this Service?'}
          </Text>
          <Text
            style={[
              styles.confirmationSubtitle,
              {color: isDarkMode ? '#ccc' : '#666'},
            ]}>
            {t('confirmation_subtitle') ||
              'Please avoid canceling – we're working to connect you with the best expert to solve your problem.'}
          </Text>

          {/* Warning Box */}
          <View
            style={[
              styles.classicWarningBox,
              {
                backgroundColor: isDarkMode ? '#4a3300' : '#fff3cd',
                borderColor: isDarkMode ? '#997a00' : '#ffc107',
              },
            ]}>
            <Text
              style={[
                styles.classicWarningTitle,
                {color: isDarkMode ? '#ffeb3b' : '#856404'},
              ]}>
              ⚠️ {t('important_note', 'Important Note')}
            </Text>
            <Text
              style={[
                styles.classicWarningText,
                {color: isDarkMode ? '#ffd54f' : '#856404'},
              ]}>
              {t('cancellation_warning') ||
                'If you cancel this service, ClickSolver is not responsible.'}
            </Text>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Text style={styles.confirmButtonText}>
              {t('cancel_service') || 'Cancel my service'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  crossContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1,
    marginHorizontal: 10,
    marginBottom: 5,
  },
  confirmationModalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  confirmationTitle: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Medium',
    textAlign: 'center',
    paddingBottom: 10,
    marginBottom: 5,
    borderBottomWidth: 1,
  },
  confirmationSubtitle: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Regular',
    textAlign: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    paddingTop: 10,
  },
  classicWarningBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    width: '100%',
  },
  classicWarningTitle: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
    marginBottom: 8,
  },
  classicWarningText: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Regular',
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: '#FF4500',
    borderRadius: 40,
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'RobotoSlab-Medium',
  },
});

export default NavigationCancellationConfirmationModal;
