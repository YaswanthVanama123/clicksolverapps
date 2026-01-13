import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Dimensions} from 'react-native';
import {useTranslation} from 'react-i18next';
import LottieView from 'lottie-react-native';

/**
 * WaitingContent Component
 * Bottom card showing waiting status, loading animation, and cancel button
 */
const WaitingContent = ({onCancel, isDarkMode}) => {
  const {t} = useTranslation();

  const styles = dynamicStyles(isDarkMode);

  return (
    <View style={styles.messageBox}>
      <View style={styles.innerButton}>
        <View style={styles.addingMessageBox} />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.detailsContainer}>
          <View style={styles.rowAlignment}>
            <Text style={styles.searchingText}>
              {t('looking_for_commander') || 'Looking best commander for you'}
            </Text>
          </View>
          <View style={styles.rowSpaceAlignment}>
            <View style={styles.rowAlignment}>
              <Text style={styles.serviceName}>
                {t('service_booked') || 'Service Booked'}
              </Text>
            </View>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>
                {t('cancel') || 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.horizontalLine} />

      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../assets/waitingLoading.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
      </View>
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    messageBox: {
      position: 'absolute',
      bottom: 0,
      height: '44%',
      width: '100%',
      backgroundColor: isDarkMode ? '#333' : '#f8f8f8',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.8,
      shadowRadius: 2,
      elevation: 5,
      flexDirection: 'column',
    },
    innerButton: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    addingMessageBox: {
      width: 60,
      height: 4,
      backgroundColor: isDarkMode ? '#444' : '#E5E7EB',
      marginTop: 10,
      borderRadius: 10,
    },
    textContainer: {
      padding: 15,
    },
    detailsContainer: {
      padding: 10,
      flexDirection: 'column',
    },
    rowAlignment: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    searchingText: {
      color: isDarkMode ? '#eee' : '#212121',
      fontSize: 14,
      fontFamily: 'RobotoSlab-Regular',
    },
    rowSpaceAlignment: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
    },
    serviceName: {
      color: isDarkMode ? '#fff' : '#1D2951',
      fontFamily: 'RobotoSlab-Medium',
      fontSize: 18,
    },
    cancelButton: {
      padding: 7,
      borderWidth: 0.5,
      borderColor: isDarkMode ? '#444' : '#CEDEEB',
      width: 90,
      borderRadius: 20,
    },
    cancelButtonText: {
      textAlign: 'center',
      color: isDarkMode ? '#ccc' : '#9e9e9e',
      fontFamily: 'RobotoSlab-Medium',
    },
    horizontalLine: {
      width: Dimensions.get('window').width,
      height: 5,
      backgroundColor: isDarkMode ? '#333' : '#E5E7EB',
    },
    loadingContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
      height: '100%',
    },
    loadingAnimation: {
      width: 130,
      height: 130,
      marginBottom: 20,
    },
  });

export default WaitingContent;
