/**
 * WorkerCard - Worker profile display card
 * Includes avatar, name, rating, services count, call/chat quick actions, gradient border
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

const WorkerCard = ({
  worker = {},
  showRating = true,
  showContact = true,
  onPress,
  onCall,
  onChat,
  isDarkMode = false,
  style,
}) => {
  const colors = getColors(isDarkMode);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const {
    id,
    name = 'Worker',
    avatar,
    rating = 0,
    totalReviews = 0,
    servicesCompleted = 0,
    specialization = 'Service Professional',
    isVerified = false,
    isAvailable = true,
    experience,
    phone,
  } = worker;

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

  const handlePress = () => {
    if (onPress) {
      onPress(worker);
    }
  };

  const handleCall = e => {
    e.stopPropagation();
    if (onCall && phone) {
      onCall(worker);
    }
  };

  const handleChat = e => {
    e.stopPropagation();
    if (onChat) {
      onChat(worker);
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
        {/* Gradient Border */}
        <LinearGradient
          colors={GRADIENTS.primaryGradient.colors}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.gradientBorder, getColoredShadow('#FF6B35', 6)]}>
          {/* Card Content */}
          <View style={[styles.card, {backgroundColor: colors.surface}]}>
            {/* Availability Badge */}
            <View
              style={[
                styles.availabilityBadge,
                {
                  backgroundColor: isAvailable
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(156, 163, 175, 0.15)',
                },
              ]}>
              <View
                style={[
                  styles.availabilityDot,
                  {
                    backgroundColor: isAvailable ? '#10B981' : '#9CA3AF',
                  },
                ]}
              />
              <Text
                style={[
                  styles.availabilityText,
                  {
                    color: isAvailable ? '#10B981' : colors.text.tertiary,
                  },
                ]}>
                {isAvailable ? 'Available' : 'Busy'}
              </Text>
            </View>

            {/* Profile Section */}
            <View style={styles.profileSection}>
              {/* Avatar with Gradient Border */}
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={GRADIENTS.secondaryGradient.colors}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.avatarGradient}>
                  <View style={styles.avatarInner}>
                    <Image
                      source={
                        avatar
                          ? typeof avatar === 'string'
                            ? {uri: avatar}
                            : avatar
                          : require('../../assets/placeholder-user.png')
                      }
                      style={styles.avatar}
                      resizeMode="cover"
                    />
                  </View>
                </LinearGradient>

                {/* Verified Badge */}
                {isVerified && (
                  <View style={styles.verifiedBadge}>
                    <LinearGradient
                      colors={GRADIENTS.successGradient.colors}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.verifiedGradient}>
                      <Icon name="check-decagram" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.info}>
                <Text style={[styles.name, {color: colors.text.primary}]} numberOfLines={1}>
                  {name}
                </Text>
                <Text
                  style={[styles.specialization, {color: colors.text.secondary}]}
                  numberOfLines={1}>
                  {specialization}
                </Text>

                {/* Experience */}
                {experience && (
                  <View style={styles.experienceContainer}>
                    <Icon
                      name="briefcase-outline"
                      size={14}
                      color={colors.text.tertiary}
                    />
                    <Text
                      style={[styles.experienceText, {color: colors.text.tertiary}]}>
                      {experience} years exp.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stats Section */}
            <View style={styles.statsSection}>
              {/* Rating */}
              {showRating && (
                <View style={styles.statItem}>
                  <LinearGradient
                    colors={GRADIENTS.accentGradient.colors}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.statIconContainer}>
                    <Icon name="star" size={16} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.statTextContainer}>
                    <Text style={[styles.statValue, {color: colors.text.primary}]}>
                      {rating.toFixed(1)}
                    </Text>
                    <Text style={[styles.statLabel, {color: colors.text.tertiary}]}>
                      ({totalReviews})
                    </Text>
                  </View>
                </View>
              )}

              {/* Services */}
              <View style={styles.statItem}>
                <LinearGradient
                  colors={GRADIENTS.infoGradient.colors}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.statIconContainer}>
                  <Icon name="check-circle" size={16} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.statTextContainer}>
                  <Text style={[styles.statValue, {color: colors.text.primary}]}>
                    {servicesCompleted}
                  </Text>
                  <Text style={[styles.statLabel, {color: colors.text.tertiary}]}>
                    Services
                  </Text>
                </View>
              </View>
            </View>

            {/* Contact Actions */}
            {showContact && (
              <View style={styles.contactSection}>
                <TouchableOpacity
                  onPress={handleCall}
                  activeOpacity={0.8}
                  style={styles.contactButton}
                  disabled={!phone}>
                  <LinearGradient
                    colors={
                      phone
                        ? GRADIENTS.successGradient.colors
                        : ['#D1D5DB', '#9CA3AF']
                    }
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.contactButtonGradient}>
                    <Icon name="phone" size={18} color="#FFFFFF" />
                    <Text style={styles.contactButtonText}>Call</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleChat}
                  activeOpacity={0.8}
                  style={styles.contactButton}>
                  <LinearGradient
                    colors={GRADIENTS.secondaryGradient.colors}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.contactButtonGradient}>
                    <Icon name="chat" size={18} color="#FFFFFF" />
                    <Text style={styles.contactButtonText}>Chat</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
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
  gradientBorder: {
    borderRadius: BORDER_RADIUS.lg,
    padding: 2,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg - 1,
    padding: SPACING.base,
  },
  availabilityBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs / 2,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  verifiedGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.xs / 2,
  },
  specialization: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  experienceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextContainer: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  contactSection: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  contactButton: {
    flex: 1,
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WorkerCard;
