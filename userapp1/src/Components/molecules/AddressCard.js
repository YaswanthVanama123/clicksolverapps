/**
 * AddressCard - Card displaying saved address
 * Includes swipe-to-delete gesture, default badge, edit/delete actions
 */

import React, {useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {getColors} from '../../theme/colors';
import {GRADIENTS} from '../../theme/gradients';
import {getShadow} from '../../theme/shadows';
import {SPACING, BORDER_RADIUS} from '../../theme/spacing';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const SWIPE_THRESHOLD = -80;
const ACTION_WIDTH = 160;

const AddressCard = ({
  address = {},
  onSelect,
  onEdit,
  onDelete,
  isDefault = false,
  isDarkMode = false,
  style,
}) => {
  const colors = getColors(isDarkMode);
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiped, setIsSwiped] = React.useState(false);

  const {
    id,
    type = 'Home',
    title,
    street = '',
    city = '',
    state = '',
    zipCode = '',
    landmark,
    fullAddress,
  } = address;

  const displayAddress = fullAddress || `${street}, ${city}, ${state} ${zipCode}`;

  // Icon mapping for address types
  const getAddressIcon = () => {
    const iconMap = {
      home: 'home',
      work: 'briefcase',
      other: 'map-marker',
    };
    return iconMap[type?.toLowerCase()] || 'map-marker';
  };

  // PanResponder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          // Only allow left swipe
          translateX.setValue(Math.max(gestureState.dx, -ACTION_WIDTH));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Swipe left - show actions
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH,
            useNativeDriver: true,
          }).start();
          setIsSwiped(true);
        } else {
          // Reset to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          setIsSwiped(false);
        }
      },
    }),
  ).current;

  const handleSelect = () => {
    if (onSelect && !isSwiped) {
      onSelect(address);
    } else if (isSwiped) {
      // Reset swipe
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      setIsSwiped(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(address);
    }
    // Reset swipe
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setIsSwiped(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(address);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Action Buttons (Behind) */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={handleEdit}
          activeOpacity={0.8}
          style={styles.actionButton}>
          <LinearGradient
            colors={GRADIENTS.infoGradient.colors}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.actionGradient}>
            <Icon name="pencil" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Edit</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.8}
          style={styles.actionButton}>
          <LinearGradient
            colors={GRADIENTS.errorGradient.colors}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.actionGradient}>
            <Icon name="delete" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Delete</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Card (Front) */}
      <Animated.View
        style={[
          styles.card,
          {transform: [{translateX}]},
        ]}
        {...panResponder.panHandlers}>
        <TouchableOpacity
          onPress={handleSelect}
          activeOpacity={0.7}>
          <View
            style={[
              styles.cardContent,
              getShadow(4),
              {backgroundColor: colors.surface},
            ]}>
            {/* Icon and Type */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={GRADIENTS.primaryGradient.colors}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.iconGradient}>
                  <Icon
                    name={getAddressIcon()}
                    size={24}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </View>

              <View style={styles.headerText}>
                <View style={styles.titleRow}>
                  <Text style={[styles.type, {color: colors.text.primary}]}>
                    {type}
                  </Text>
                  {isDefault && (
                    <LinearGradient
                      colors={GRADIENTS.successGradient.colors}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={styles.defaultBadge}>
                      <Icon name="check-circle" size={12} color="#FFFFFF" />
                      <Text style={styles.defaultText}>Default</Text>
                    </LinearGradient>
                  )}
                </View>
                {title && (
                  <Text
                    style={[styles.title, {color: colors.text.secondary}]}
                    numberOfLines={1}>
                    {title}
                  </Text>
                )}
              </View>
            </View>

            {/* Address */}
            <Text
              style={[styles.address, {color: colors.text.secondary}]}
              numberOfLines={2}>
              {displayAddress}
            </Text>

            {/* Landmark */}
            {landmark && (
              <View style={styles.landmarkContainer}>
                <Icon
                  name="map-marker-outline"
                  size={14}
                  color={colors.text.tertiary}
                />
                <Text
                  style={[styles.landmark, {color: colors.text.tertiary}]}
                  numberOfLines={1}>
                  {landmark}
                </Text>
              </View>
            )}

            {/* Swipe Indicator */}
            {!isSwiped && (
              <View style={styles.swipeIndicator}>
                <Icon
                  name="chevron-left"
                  size={16}
                  color={colors.text.tertiary}
                />
                <Text style={[styles.swipeText, {color: colors.text.tertiary}]}>
                  Swipe for actions
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.base,
    height: 140,
    position: 'relative',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 80,
    height: '100%',
  },
  actionGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    marginRight: SPACING.md,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  type: {
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: SPACING.xs,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.xs,
    gap: SPACING.xs / 2,
  },
  defaultText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  address: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  landmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  landmark: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  swipeIndicator: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  swipeText: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default AddressCard;
