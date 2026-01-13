/**
 * ServiceCard - Vibrant gradient card for services
 * Displays service information with image, title, price, rating
 * Includes quick action button overlay and animated press effect
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {getColors} from '../../theme/colors';
import {GRADIENTS} from '../../theme/gradients';
import {getShadow, getColoredShadow} from '../../theme/shadows';
import {SPACING, BORDER_RADIUS} from '../../theme/spacing';

const ServiceCard = ({
  service = {},
  onPress,
  onQuickBook,
  isDarkMode = false,
  style,
}) => {
  const colors = getColors(isDarkMode);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const {
    id,
    image,
    title = 'Service',
    price = '0',
    rating = 0,
    reviews = 0,
    category,
    discount,
  } = service;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (onPress) {
      onPress(service);
    }
  };

  const handleQuickBook = e => {
    e.stopPropagation();
    if (onQuickBook) {
      onQuickBook(service);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {transform: [{scale: scaleAnim}]},
        style,
      ]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={[
            styles.card,
            getShadow(8),
            {backgroundColor: colors.surface},
          ]}>
          {/* Image Container */}
          <View style={styles.imageContainer}>
            <Image
              source={
                image
                  ? typeof image === 'string'
                    ? {uri: image}
                    : image
                  : require('../../assets/placeholder.png')
              }
              style={styles.image}
              resizeMode="cover"
            />

            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageOverlay}
            />

            {/* Discount Badge */}
            {discount && (
              <LinearGradient
                colors={GRADIENTS.errorGradient.colors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[styles.discountBadge, getShadow(4)]}>
                <Text style={styles.discountText}>{discount}% OFF</Text>
              </LinearGradient>
            )}

            {/* Quick Book Button */}
            <TouchableOpacity
              onPress={handleQuickBook}
              activeOpacity={0.8}
              style={styles.quickBookButton}>
              <LinearGradient
                colors={GRADIENTS.primaryGradient.colors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[styles.quickBookGradient, getColoredShadow('#FF6B35', 6)]}>
                <Icon name="calendar-clock" size={20} color="#FFFFFF" />
                <Text style={styles.quickBookText}>Book</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Content Container */}
          <View style={styles.content}>
            {/* Category Tag */}
            {category && (
              <View style={styles.categoryContainer}>
                <Text
                  style={[styles.categoryText, {color: colors.text.secondary}]}
                  numberOfLines={1}>
                  {category}
                </Text>
              </View>
            )}

            {/* Title */}
            <Text
              style={[styles.title, {color: colors.text.primary}]}
              numberOfLines={2}>
              {title}
            </Text>

            {/* Bottom Row */}
            <View style={styles.bottomRow}>
              {/* Rating */}
              <View style={styles.ratingContainer}>
                <Icon name="star" size={16} color="#FBBF24" />
                <Text style={[styles.ratingText, {color: colors.text.primary}]}>
                  {rating.toFixed(1)}
                </Text>
                <Text
                  style={[styles.reviewsText, {color: colors.text.secondary}]}>
                  ({reviews})
                </Text>
              </View>

              {/* Price */}
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>From</Text>
                <LinearGradient
                  colors={GRADIENTS.primaryGradient.colors}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.priceGradient}>
                  <Text style={styles.priceText}>₹{price}</Text>
                </LinearGradient>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.base,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  quickBookButton: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
  },
  quickBookGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  quickBookText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.base,
  },
  categoryContainer: {
    marginBottom: SPACING.xs,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewsText: {
    fontSize: 12,
    fontWeight: '400',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  priceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  priceGradient: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ServiceCard;
