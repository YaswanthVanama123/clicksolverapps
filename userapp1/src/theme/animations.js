/**
 * Animation System - Smooth and consistent animations
 * Timing functions and animation configurations
 */

import {Easing} from 'react-native';

/**
 * Animation timing constants (in milliseconds)
 */
export const TIMING = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

/**
 * Animation configurations
 */
export const ANIMATIONS = {
  // Spring animation - Bouncy, natural feel
  spring: {
    type: 'spring',
    stiffness: 100,
    damping: 20,
    mass: 1,
  },

  // Timing animation - Smooth easing
  timing: {
    duration: TIMING.normal,
    easing: Easing.inOut(Easing.ease),
  },

  // Fast animation - Quick transitions
  fast: {
    duration: TIMING.fast,
    easing: Easing.inOut(Easing.ease),
  },

  // Slow animation - Deliberate, smooth
  slow: {
    duration: TIMING.slow,
    easing: Easing.inOut(Easing.ease),
  },

  // Bouncy spring - More playful
  bouncySpring: {
    type: 'spring',
    stiffness: 150,
    damping: 15,
    mass: 1,
  },

  // Gentle spring - Subtle bounce
  gentleSpring: {
    type: 'spring',
    stiffness: 80,
    damping: 25,
    mass: 1,
  },

  // Linear - No easing
  linear: {
    duration: TIMING.normal,
    easing: Easing.linear,
  },

  // Ease in - Starts slow
  easeIn: {
    duration: TIMING.normal,
    easing: Easing.in(Easing.ease),
  },

  // Ease out - Ends slow
  easeOut: {
    duration: TIMING.normal,
    easing: Easing.out(Easing.ease),
  },

  // Ease in-out - Smooth start and end
  easeInOut: {
    duration: TIMING.normal,
    easing: Easing.inOut(Easing.ease),
  },

  // Elastic - Overshoot effect
  elastic: {
    duration: TIMING.slow,
    easing: Easing.elastic(1),
  },

  // Back - Slight backward motion before moving forward
  back: {
    duration: TIMING.normal,
    easing: Easing.back(1.5),
  },
};

/**
 * Easing functions
 */
export const EASING = {
  linear: Easing.linear,
  ease: Easing.ease,
  quad: Easing.quad,
  cubic: Easing.cubic,
  poly: Easing.poly(4),
  sin: Easing.sin,
  circle: Easing.circle,
  exp: Easing.exp,
  elastic: Easing.elastic(1),
  back: Easing.back(1.5),
  bounce: Easing.bounce,
  bezier: Easing.bezier(0.25, 0.1, 0.25, 1),

  // Combined easings
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  easeInQuad: Easing.in(Easing.quad),
  easeOutQuad: Easing.out(Easing.quad),
  easeInOutQuad: Easing.inOut(Easing.quad),
  easeInCubic: Easing.in(Easing.cubic),
  easeOutCubic: Easing.out(Easing.cubic),
  easeInOutCubic: Easing.inOut(Easing.cubic),
};

/**
 * Layout animation configs
 */
export const LAYOUT_ANIMATIONS = {
  spring: {
    duration: TIMING.normal,
    create: {
      type: 'spring',
      property: 'opacity',
      springDamping: 0.7,
    },
    update: {
      type: 'spring',
      springDamping: 0.7,
    },
    delete: {
      type: 'spring',
      property: 'opacity',
      springDamping: 0.7,
    },
  },
  linear: {
    duration: TIMING.fast,
    create: {
      type: 'linear',
      property: 'opacity',
    },
    update: {
      type: 'linear',
    },
    delete: {
      type: 'linear',
      property: 'opacity',
    },
  },
  easeInEaseOut: {
    duration: TIMING.normal,
    create: {
      type: 'easeInEaseOut',
      property: 'opacity',
    },
    update: {
      type: 'easeInEaseOut',
    },
    delete: {
      type: 'easeInEaseOut',
      property: 'opacity',
    },
  },
};

/**
 * Gesture animation configs
 */
export const GESTURE_ANIMATIONS = {
  swipe: {
    velocity: 500,
    tension: 40,
    friction: 7,
  },
  pan: {
    velocity: 300,
    tension: 50,
    friction: 8,
  },
  drag: {
    velocity: 200,
    tension: 60,
    friction: 9,
  },
};

/**
 * Transition presets for screen navigation
 */
export const TRANSITIONS = {
  fade: {
    animation: 'timing',
    config: {
      duration: TIMING.normal,
      easing: Easing.inOut(Easing.ease),
    },
  },
  slide: {
    animation: 'spring',
    config: {
      stiffness: 100,
      damping: 20,
      mass: 1,
    },
  },
  scale: {
    animation: 'timing',
    config: {
      duration: TIMING.normal,
      easing: Easing.out(Easing.ease),
    },
  },
};

/**
 * Get animation config by name
 * @param {string} name - Animation name
 * @returns {object} Animation configuration
 */
export const getAnimation = (name = 'timing') => {
  return ANIMATIONS[name] || ANIMATIONS.timing;
};

/**
 * Create custom animation config
 * @param {number} duration - Animation duration in ms
 * @param {function} easing - Easing function
 * @returns {object} Custom animation config
 */
export const createAnimation = (duration = TIMING.normal, easing = EASING.easeInOut) => {
  return {
    duration,
    easing,
  };
};

/**
 * Create custom spring config
 * @param {number} stiffness - Spring stiffness
 * @param {number} damping - Spring damping
 * @param {number} mass - Spring mass
 * @returns {object} Custom spring config
 */
export const createSpring = (stiffness = 100, damping = 20, mass = 1) => {
  return {
    type: 'spring',
    stiffness,
    damping,
    mass,
  };
};

export default ANIMATIONS;
