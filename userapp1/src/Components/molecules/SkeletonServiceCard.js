import React from 'react';
import {View, StyleSheet, useWindowDimensions} from 'react-native';
import Skeleton from '../atoms/Skeleton';
import {useTheme} from '../../context/ThemeContext';

/**
 * SkeletonServiceCard Component
 * Loading skeleton that matches the ServiceCard layout
 * Displays placeholder elements while service data is loading
 */
const SkeletonServiceCard = () => {
  const {isDarkMode} = useTheme();
  const {width} = useWindowDimensions();
  const isTablet = width >= 600;
  const styles = dynamicStyles(width, isDarkMode);

  return (
    <View style={styles.container}>
      {/* Image Skeleton */}
      <Skeleton
        width="100%"
        height={isTablet ? 200 : 160}
        borderRadius={isTablet ? 12 : 10}
        style={styles.imageSkeleton}
      />

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Title Skeleton */}
        <Skeleton
          width="85%"
          height={isTablet ? 18 : 16}
          borderRadius={4}
          style={styles.titleSkeleton}
        />

        {/* Rating/Badge Skeleton */}
        <View style={styles.badgeRow}>
          <Skeleton
            width={isTablet ? 80 : 70}
            height={isTablet ? 20 : 18}
            borderRadius={12}
            style={styles.badgeSkeleton}
          />
          <Skeleton
            width={isTablet ? 70 : 60}
            height={isTablet ? 20 : 18}
            borderRadius={12}
            style={styles.badgeSkeleton}
          />
        </View>

        {/* Description Skeleton */}
        <Skeleton
          width="100%"
          height={isTablet ? 14 : 12}
          borderRadius={4}
          style={styles.descriptionSkeleton}
        />
        <Skeleton
          width="95%"
          height={isTablet ? 14 : 12}
          borderRadius={4}
          style={styles.descriptionSkeleton}
        />

        {/* Price and Button Row */}
        <View style={styles.footerRow}>
          {/* Price Skeleton */}
          <Skeleton
            width={isTablet ? 100 : 80}
            height={isTablet ? 20 : 18}
            borderRadius={4}
            style={styles.priceSkeleton}
          />

          {/* Button Skeleton */}
          <Skeleton
            width={isTablet ? 100 : 80}
            height={isTablet ? 38 : 34}
            borderRadius={isTablet ? 8 : 6}
            style={styles.buttonSkeleton}
          />
        </View>
      </View>
    </View>
  );
};

const dynamicStyles = (width, isDarkMode) => {
  const isTablet = width >= 600;
  const cardWidth = width - (isTablet ? 40 : 32);

  return StyleSheet.create({
    container: {
      width: cardWidth,
      maxWidth: isTablet ? 500 : 400,
      borderRadius: isTablet ? 12 : 10,
      overflow: 'hidden',
      backgroundColor: isDarkMode ? '#1A1A2E' : '#FFFFFF',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 3,
      marginHorizontal: isTablet ? 20 : 16,
      marginVertical: isTablet ? 10 : 8,
    },
    imageSkeleton: {
      marginBottom: isTablet ? 12 : 10,
    },
    contentContainer: {
      paddingHorizontal: isTablet ? 16 : 12,
      paddingVertical: isTablet ? 14 : 12,
    },
    titleSkeleton: {
      marginBottom: isTablet ? 12 : 10,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: isTablet ? 8 : 6,
      marginBottom: isTablet ? 12 : 10,
    },
    badgeSkeleton: {
      flex: 1,
    },
    descriptionSkeleton: {
      marginBottom: isTablet ? 8 : 6,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: isTablet ? 12 : 10,
    },
    priceSkeleton: {
      flex: 1,
    },
    buttonSkeleton: {
      marginLeft: isTablet ? 12 : 10,
      flex: 1,
    },
  });
};

export default SkeletonServiceCard;
