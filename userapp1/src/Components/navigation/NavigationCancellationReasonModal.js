import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Modal} from 'react-native';
import {useTranslation} from 'react-i18next';
import AntDesign from 'react-native-vector-icons/AntDesign';

/**
 * NavigationCancellationReasonModal Component
 * Modal for selecting cancellation reason on navigation screen
 */
const NavigationCancellationReasonModal = ({
  visible,
  onClose,
  onSelectReason,
  isDarkMode,
}) => {
  const {t} = useTranslation();

  const reasons = [
    {key: 'better_price', label: t('found_better_price') || 'Found a better price'},
    {key: 'wrong_location', label: t('wrong_location') || 'Wrong work location'},
    {key: 'wrong_service', label: t('wrong_service') || 'Wrong service booked'},
    {key: 'more_time', label: t('more_time') || 'More time to assign a commander'},
    {key: 'others', label: t('others') || 'Others'},
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          onPress={onClose}
          style={[
            styles.backButtonContainer,
            {backgroundColor: isDarkMode ? '#333' : 'white'},
          ]}>
          <AntDesign name="arrowleft" size={20} color={isDarkMode ? '#fff' : 'black'} />
        </TouchableOpacity>

        <View
          style={[
            styles.modalContainer,
            {backgroundColor: isDarkMode ? '#333' : 'white'},
          ]}>
          <Text style={[styles.modalTitle, {color: isDarkMode ? '#fff' : '#000'}]}>
            {t('cancellation_reason_title') ||
              'What is the reason for your cancellation?'}
          </Text>
          <Text
            style={[
              styles.modalSubtitle,
              {
                color: isDarkMode ? '#ccc' : '#666',
                borderBottomColor: isDarkMode ? '#555' : '#eee',
              },
            ]}>
            {t('cancellation_reason_subtitle') ||
              "Could you let us know why you're canceling?"}
          </Text>

          {reasons.map((reason, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.reasonButton,
                {borderBottomColor: isDarkMode ? '#555' : '#eee'},
              ]}
              onPress={() => onSelectReason(reason.label)}>
              <Text style={[styles.reasonText, {color: isDarkMode ? '#fff' : '#333'}]}>
                {reason.label}
              </Text>
              <AntDesign
                name="right"
                size={16}
                color={isDarkMode ? '#fff' : '#4a4a4a'}
              />
            </TouchableOpacity>
          ))}
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
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Medium',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    paddingBottom: 10,
    fontFamily: 'RobotoSlab-Regular',
  },
  reasonButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  reasonText: {
    fontSize: 16,
    fontFamily: 'RobotoSlab-Regular',
  },
});

export default NavigationCancellationReasonModal;
