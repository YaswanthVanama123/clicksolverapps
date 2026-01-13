import {useEffect, useRef} from 'react';
import {Animated, Easing, AppState} from 'react-native';

/**
 * useMapRefresh Hook
 * Manages refresh icon animation and camera refitting
 * @param {boolean} isLoading - Loading state
 * @param {object} cameraBounds - Camera bounds object
 * @param {object} cameraRef - Ref to Mapbox camera
 * @returns {object} Rotation animation value
 */
const useMapRefresh = (isLoading, cameraBounds, cameraRef) => {
  const rotationValue = useRef(new Animated.Value(0)).current;
  const appState = useRef(AppState.currentState);

  // Animate refresh icon when loading
  useEffect(() => {
    let animation;
    if (isLoading) {
      rotationValue.setValue(0);
      animation = Animated.loop(
        Animated.timing(rotationValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animation.start();
    } else if (animation) {
      animation.stop();
    }
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isLoading, rotationValue]);

  const spin = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Fit camera bounds when they change
  useEffect(() => {
    if (cameraBounds && cameraRef.current) {
      cameraRef.current.fitBounds(
        [cameraBounds.sw[0], cameraBounds.sw[1]],
        [cameraBounds.ne[0], cameraBounds.ne[1]],
        50,
      );
    }
  }, [cameraBounds, cameraRef]);

  // Re-fit camera when app returns from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (cameraBounds && cameraRef.current) {
          cameraRef.current.fitBounds(
            [cameraBounds.sw[0], cameraBounds.sw[1]],
            [cameraBounds.ne[0], cameraBounds.ne[1]],
            50,
          );
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [cameraBounds, cameraRef]);

  return {spin};
};

export default useMapRefresh;
