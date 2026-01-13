/**
 * BottomSheet - Modern bottom sheet modal
 * Includes drag handle, backdrop with blur, animated slide up/down
 * Uses react-native-reanimated for smooth animations
 */

import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {getColors} from '../../theme/colors';
import {GRADIENTS} from '../../theme/gradients';
import {getShadow} from '../../theme/shadows';
import {SPACING, BORDER_RADIUS} from '../../theme/spacing';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const MAX_DOWNWARD_TRANSLATE_Y = 0;
const MAX_UPWARD_TRANSLATE_Y = SCREEN_HEIGHT;
const DRAG_THRESHOLD = 50;

const BottomSheet = ({
  visible = false,
  onClose,
  children,
  height = SCREEN_HEIGHT * 0.6,
  snapPoints = [],
  title = '',
  showHandle = true,
  closeOnBackdropPress = true,
  closeOnSwipeDown = true,
  isDarkMode = false,
  headerComponent,
  footerComponent,
}) => {
  const colors = getColors(isDarkMode);
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const panY = React.useRef(new Animated.Value(0)).current;

  // Calculate sheet height
  const sheetHeight = snapPoints.length > 0 ? snapPoints[0] : height;

  // Reset animation when modal opens/closes
  useEffect(() => {
    if (visible) {
      panY.setValue(sheetHeight);
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    }
  }, [visible, sheetHeight, panY]);

  // Close with animation
  const closeModal = useCallback(() => {
    Animated.timing(panY, {
      toValue: sheetHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onClose) {
        onClose();
      }
    });
  }, [onClose, panY, sheetHeight]);

  // Pan responder for drag gesture
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => closeOnSwipeDown,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return closeOnSwipeDown && gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          closeModal();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
        }
      },
    }),
  ).current;

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      closeModal();
    }
  };

  if (!visible) return null;

  const translateY = panY.interpolate({
    inputRange: [0, sheetHeight],
    outputRange: [0, sheetHeight],
    extrapolate: 'clamp',
  });

  const backdropOpacity = panY.interpolate({
    inputRange: [0, sheetHeight],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeModal}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}>
          <View
            style={[
              styles.backdropGradient,
              {backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)'},
            ]}
          />
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.container,
          {
            height: sheetHeight,
            transform: [{translateY}],
          },
        ]}
        {...(closeOnSwipeDown ? panResponder.panHandlers : {})}>
        <View
          style={[
            styles.sheet,
            {backgroundColor: colors.background},
            getShadow(12),
          ]}>
          {/* Drag Handle */}
          {showHandle && (
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  {backgroundColor: colors.text.tertiary},
                ]}
              />
            </View>
          )}

          {/* Header */}
          {(title || headerComponent) && (
            <View
              style={[
                styles.header,
                {borderBottomColor: colors.divider},
              ]}>
              {headerComponent || (
                <View style={styles.headerContent}>
                  <Text style={[styles.title, {color: colors.text.primary}]}>
                    {title}
                  </Text>
                  {onClose && (
                    <TouchableOpacity
                      onPress={closeModal}
                      style={styles.closeButton}
                      hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}>
                      <LinearGradient
                        colors={['rgba(255,107,53,0.1)', 'rgba(247,147,30,0.1)']}
                        style={styles.closeButtonGradient}>
                        <Text style={[styles.closeButtonText, {color: colors.primary}]}>
                          ✕
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>{children}</View>

          {/* Footer */}
          {footerComponent && (
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: colors.divider,
                  backgroundColor: colors.surface,
                },
              ]}>
              {footerComponent}
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropGradient: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  header: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    marginLeft: SPACING.md,
  },
  closeButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
  },
  footer: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    borderTopWidth: 1,
  },
});

export default BottomSheet;
