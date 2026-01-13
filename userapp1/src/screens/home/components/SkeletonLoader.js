import React from 'react';
import {View, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {useEffect} from 'react';

const SkeletonLoader = ({isDarkMode}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, {duration: 800}),
        withTiming(0.3, {duration: 800}),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const skeletonColor = isDarkMode ? '#2a2a2a' : '#E0E0E0';

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerSkeleton}>
        <Animated.View
          style={[
            styles.avatarSkeleton,
            {backgroundColor: skeletonColor},
            animatedStyle,
          ]}
        />
        <View style={styles.headerTextSkeleton}>
          <Animated.View
            style={[
              styles.textLineSkeleton,
              {backgroundColor: skeletonColor, width: 120},
              animatedStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.textLineSkeleton,
              {backgroundColor: skeletonColor, width: 80, marginTop: 8},
              animatedStyle,
            ]}
          />
        </View>
      </View>

      {/* Search Bar Skeleton */}
      <Animated.View
        style={[
          styles.searchBarSkeleton,
          {backgroundColor: skeletonColor},
          animatedStyle,
        ]}
      />

      {/* Quick Actions Skeleton */}
      <View style={styles.quickActionsSkeleton}>
        {[1, 2, 3, 4].map(i => (
          <Animated.View
            key={i}
            style={[
              styles.quickActionCircle,
              {backgroundColor: skeletonColor},
              animatedStyle,
            ]}
          />
        ))}
      </View>

      {/* Service Cards Skeleton */}
      {[1, 2, 3].map(i => (
        <Animated.View
          key={i}
          style={[
            styles.serviceCardSkeleton,
            {backgroundColor: skeletonColor},
            animatedStyle,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  headerTextSkeleton: {
    flex: 1,
  },
  textLineSkeleton: {
    height: 14,
    borderRadius: 7,
  },
  searchBarSkeleton: {
    height: 50,
    borderRadius: 25,
    marginBottom: 20,
  },
  quickActionsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  quickActionCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  serviceCardSkeleton: {
    height: 120,
    borderRadius: 15,
    marginBottom: 15,
  },
});

export default SkeletonLoader;
