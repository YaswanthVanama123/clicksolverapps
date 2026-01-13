/**
 * OfferCard - Promotional offer card with bold styling
 * Includes gradient background, discount percentage highlight, apply button, expiry countdown
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {getColors} from '../../theme/colors';
import {GRADIENTS} from '../../theme/gradients';
import {getShadow, getColoredShadow} from '../../theme/shadows';
import {SPACING, BORDER_RADIUS} from '../../theme/spacing';

const OfferCard = ({
  offer = {},
  onApply,
  isDarkMode = false,
  style,
}) => {
  const colors = getColors(isDarkMode);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [timeRemaining, setTimeRemaining] = useState('');

  const {
    id,
    code = 'SAVE20',
    title = 'Special Offer',
    description = 'Get amazing discounts',
    discount = 20,
    discountType = 'percentage', // percentage or flat
    minAmount,
    maxDiscount,
    expiresAt,
    termsAndConditions = [],
    isApplied = false,
  } = offer;

  // Calculate time remaining
  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const distance = expiry - now;

      if (distance < 0) {
        setTimeRemaining('Expired');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m left`);
      } else {
        setTimeRemaining(`${minutes}m left`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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

  const handleApply = () => {
    if (onApply && !isApplied) {
      onApply(offer);
    }
  };

  const getDiscountText = () => {
    if (discountType === 'percentage') {
      return `${discount}%`;
    }
    return `₹${discount}`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {transform: [{scale: scaleAnim}]},
        style,
      ]}>
      <TouchableOpacity
        onPress={handleApply}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={isApplied}>
        <LinearGradient
          colors={
            isApplied
              ? ['#10B981', '#34D399']
              : GRADIENTS.sunsetGradient.colors
          }
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.card, getColoredShadow('#FF6B35', 8)]}>
          {/* Decorative Pattern */}
          <View style={styles.decorativePattern}>
            <Icon name="circle" size={100} color="rgba(255,255,255,0.1)" />
            <Icon
              name="circle"
              size={60}
              color="rgba(255,255,255,0.1)"
              style={styles.decorativeCircle2}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              {/* Discount Badge */}
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{getDiscountText()}</Text>
                <Text style={styles.offText}>OFF</Text>
              </View>

              {/* Timer */}
              {timeRemaining && (
                <View style={styles.timerContainer}>
                  <Icon name="clock-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.timerText}>{timeRemaining}</Text>
                </View>
              )}
            </View>

            {/* Title & Description */}
            <View style={styles.textContent}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {description}
              </Text>

              {/* Code Display */}
              <View style={styles.codeContainer}>
                <View style={styles.codeBadge}>
                  <Icon name="tag-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.codeText}>{code}</Text>
                </View>
                <View style={styles.dashedLine} />
              </View>

              {/* Conditions */}
              <View style={styles.conditions}>
                {minAmount && (
                  <View style={styles.conditionItem}>
                    <Icon name="information" size={12} color="#FFFFFF" />
                    <Text style={styles.conditionText}>
                      Min order: ₹{minAmount}
                    </Text>
                  </View>
                )}
                {maxDiscount && (
                  <View style={styles.conditionItem}>
                    <Icon name="information" size={12} color="#FFFFFF" />
                    <Text style={styles.conditionText}>
                      Max: ₹{maxDiscount}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Apply Button */}
            <View style={styles.applyButtonContainer}>
              <View style={styles.applyButton}>
                <Text style={styles.applyButtonText}>
                  {isApplied ? 'APPLIED' : 'APPLY NOW'}
                </Text>
                <Icon
                  name={isApplied ? 'check-circle' : 'arrow-right'}
                  size={20}
                  color="#FF6B35"
                />
              </View>
            </View>
          </View>

          {/* Applied Checkmark Overlay */}
          {isApplied && (
            <View style={styles.appliedOverlay}>
              <Icon name="check-circle" size={48} color="#FFFFFF" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
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
    minHeight: 180,
    position: 'relative',
  },
  decorativePattern: {
    position: 'absolute',
    top: -30,
    right: -30,
    opacity: 0.3,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -20,
    left: 40,
  },
  content: {
    padding: SPACING.base,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  discountBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  offText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  textContent: {
    marginBottom: SPACING.base,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  codeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    marginLeft: SPACING.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  conditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  conditionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.9,
  },
  applyButtonContainer: {
    alignItems: 'flex-end',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
    ...getShadow(4),
  },
  applyButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appliedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});

export default OfferCard;
