import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image, Animated} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const GradientHeader = ({
  greeting,
  greetingIcon,
  userName,
  userProfile,
  notificationCount,
  onNotificationPress,
  onProfilePress,
  scrollY,
  isDarkMode,
}) => {
  // Animate header on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.headerWrapper,
        {
          opacity: headerOpacity,
          transform: [{scale: headerScale}],
        },
      ]}>
      <LinearGradient
        colors={isDarkMode ? ['#1a1a1a', '#121212'] : ['#ffffff', '#f8f9fa']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradientContainer}>
        <View style={styles.header}>
          {/* User Info */}
          <TouchableOpacity
            style={styles.userInfo}
            onPress={onProfilePress}
            activeOpacity={0.7}>
            {userProfile ? (
              <Image
                source={{uri: userProfile}}
                style={styles.userAvatar}
              />
            ) : (
              <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {userName?.charAt?.(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.greetingContainer}>
              <Text style={[styles.greetingText, {color: isDarkMode ? '#B0B0B0' : '#757575'}]}>
                {greeting} {greetingIcon}
              </Text>
              <Text style={[styles.userName, {color: isDarkMode ? '#FFFFFF' : '#1D2951'}]}>
                {userName || 'User'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={onNotificationPress}
            activeOpacity={0.7}>
            <LinearGradient
              colors={['#FF6B35', '#F24E1E']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.notificationGradient}>
              <Icon name="notifications-outline" size={22} color="#FFFFFF" />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    marginBottom: 10,
  },
  gradientContainer: {
    borderRadius: 0,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#F24E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'RobotoSlab-Bold',
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Medium',
    fontStyle: 'italic',
  },
  userName: {
    fontSize: 18,
    fontFamily: 'RobotoSlab-Bold',
    marginTop: 2,
  },
  notificationButton: {
    marginLeft: 12,
  },
  notificationGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#000000',
    fontSize: 11,
    fontFamily: 'RobotoSlab-Bold',
  },
});

export default GradientHeader;
