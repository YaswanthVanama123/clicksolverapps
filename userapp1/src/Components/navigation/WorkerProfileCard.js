import React from 'react';
import {View, StyleSheet, Text, Image, TouchableOpacity} from 'react-native';
import {useTranslation} from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import StarRating from '../common/StarRating';

/**
 * WorkerProfileCard Component
 * Displays worker profile with rating, service count, and action buttons
 */
const WorkerProfileCard = ({
  workerDetails,
  onCall,
  onMessage,
  isDarkMode,
  isTablet,
}) => {
  const {t} = useTranslation();

  if (!workerDetails.name) return null;

  return (
    <View style={styles.rightSection}>
      {/* Profile Image */}
      <View style={[styles.profileImage, {width: isTablet ? 100 : 90, height: isTablet ? 100 : 90}]}>
        {workerDetails.profile && (
          <Image source={{uri: workerDetails.profile}} style={styles.image} />
        )}
      </View>

      {/* Worker Name */}
      <Text style={[styles.workerName, {fontSize: isTablet ? 16 : 14, color: isDarkMode ? '#fff' : '#1D2951'}]}>
        {workerDetails.name}
      </Text>

      {/* Rating */}
      {workerDetails.rating !== undefined && (
        <View style={styles.ratingContainer}>
          <Text style={[styles.ratingNumber, {color: isDarkMode ? '#ccc' : '#212121', fontSize: isTablet ? 15 : 13}]}>
            {Number(workerDetails.rating).toFixed(1)}
          </Text>
          <StarRating rating={Number(workerDetails.rating)} starSize={16} isDarkMode={isDarkMode} />
        </View>
      )}

      {/* Service Count */}
      {workerDetails.serviceCounts !== undefined &&
        workerDetails.serviceCounts > 0 && (
          <View style={styles.serviceContainer}>
            <Text style={[styles.serviceNumber, {color: isDarkMode ? '#aaa' : '#9e9e9e', fontSize: isTablet ? 13 : 12}]}>
              {t('no_of_services') || 'No of Services:'}{' '}
              <Text style={[styles.ratingNumber, {color: isDarkMode ? '#ccc' : '#212121'}]}>
                {Number(workerDetails.serviceCounts)}
              </Text>
            </Text>
          </View>
        )}

      {/* Action Buttons (Call / Message) */}
      <View style={styles.iconsContainer}>
        <TouchableOpacity style={[styles.actionButton, {backgroundColor: isDarkMode ? '#444' : '#f6f6f6'}]} onPress={onCall}>
          <MaterialIcons name="call" size={18} color="#FF5722" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, {backgroundColor: isDarkMode ? '#444' : '#f6f6f6'}]} onPress={onMessage}>
          <AntDesign name="message1" size={18} color="#FF5722" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rightSection: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profileImage: {
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  workerName: {
    fontFamily: 'RobotoSlab-Medium',
    textAlign: 'center',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingNumber: {
    fontFamily: 'RobotoSlab-Regular',
    marginRight: 4,
  },
  serviceContainer: {
    marginBottom: 5,
  },
  serviceNumber: {
    fontFamily: 'RobotoSlab-Regular',
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 5,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WorkerProfileCard;
