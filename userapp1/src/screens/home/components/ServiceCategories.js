import React, {memo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../../../context/ThemeContext';
import {GRADIENTS} from '../../../theme/gradients';
import {getColors} from '../../../theme/colors';

const SkeletonCard = ({isDarkMode}) => (
  <View style={styles.skeletonCard}>
    <View
      style={[
        styles.skeletonImage,
        {backgroundColor: isDarkMode ? '#333' : '#E5E7EB'},
      ]}
    />
    <View style={styles.skeletonTextContainer}>
      <View
        style={[
          styles.skeletonTitle,
          {backgroundColor: isDarkMode ? '#444' : '#D1D5DB'},
        ]}
      />
      <View
        style={[
          styles.skeletonPrice,
          {backgroundColor: isDarkMode ? '#444' : '#D1D5DB'},
        ]}
      />
    </View>
  </View>
);

const ServiceCard = memo(
  ({category, onPress, onQuickBook, isDarkMode, colors, index}) => {
    const gradients = [
      GRADIENTS.primaryGradient,
      GRADIENTS.secondaryGradient,
      GRADIENTS.accentGradient,
      GRADIENTS.oceanGradient,
      GRADIENTS.successGradient,
      GRADIENTS.purpleHazeGradient,
    ];
    const gradient = gradients[index % gradients.length];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(category)}
        activeOpacity={0.9}>
        <LinearGradient
          colors={[...gradient.colors, 'rgba(0,0,0,0.1)']}
          start={gradient.start}
          end={gradient.end}
          style={styles.cardGradient}>
          {/* Service Image */}
          {category.imageUrl && (
            <Image
              source={{uri: category.imageUrl}}
              style={styles.categoryImage}
              resizeMode="cover"
            />
          )}

          {/* Overlay Content */}
          <View style={styles.cardOverlay}>
            <View style={styles.cardContent}>
              <Text style={styles.categoryName} numberOfLines={2}>
                {category.name}
              </Text>
              {category.startingPrice && (
                <Text style={styles.startingPrice}>
                  From ₹{category.startingPrice}
                </Text>
              )}
            </View>

            {/* Quick Book Button */}
            {onQuickBook && (
              <TouchableOpacity
                style={styles.quickBookButton}
                onPress={e => {
                  e.stopPropagation();
                  onQuickBook(category);
                }}
                activeOpacity={0.8}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                  style={styles.quickBookGradient}>
                  <Text style={styles.quickBookText}>Book</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  },
);

const ServiceCategories = ({
  categories = [],
  onCategoryPress,
  onQuickBook,
  loading = false,
}) => {
  const {width} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const isTablet = width >= 600;

  const numColumns = 2;
  const cardWidth = (width - 48 - 16) / numColumns; // accounting for padding and gap

  const renderSkeletons = () => {
    return Array.from({length: 6}).map((_, index) => (
      <View key={`skeleton-${index}`} style={{width: cardWidth, padding: 4}}>
        <SkeletonCard isDarkMode={isDarkMode} />
      </View>
    ));
  };

  const renderItem = ({item, index}) => (
    <View style={{width: cardWidth, padding: 4}}>
      <ServiceCard
        category={item}
        onPress={onCategoryPress}
        onQuickBook={onQuickBook}
        isDarkMode={isDarkMode}
        colors={colors}
        index={index}
      />
    </View>
  );

  if (loading) {
    return <View style={styles.grid}>{renderSkeletons()}</View>;
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <FlatList
      data={categories}
      renderItem={renderItem}
      keyExtractor={(item, index) => item.id?.toString() || `category-${index}`}
      numColumns={numColumns}
      contentContainerStyle={styles.listContent}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  card: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardGradient: {
    flex: 1,
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.3,
  },
  cardOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  categoryName: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  startingPrice: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Medium',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  quickBookButton: {
    alignSelf: 'flex-end',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  quickBookGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickBookText: {
    fontSize: 12,
    fontFamily: 'RobotoSlab-Bold',
    color: '#FF6B35',
  },
  // Skeleton styles
  skeletonCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  skeletonImage: {
    width: '100%',
    height: '60%',
    borderRadius: 12,
    marginBottom: 12,
  },
  skeletonTextContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  skeletonTitle: {
    height: 20,
    width: '80%',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonPrice: {
    height: 16,
    width: '50%',
    borderRadius: 4,
  },
});

export default memo(ServiceCategories);
