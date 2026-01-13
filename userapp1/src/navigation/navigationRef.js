/**
 * Navigation Reference for Programmatic Navigation
 * Allows navigation from outside React components (e.g., services, utils, notifications)
 */

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Navigate to a specific screen
 * @param {string} name - Screen name
 * @param {object} params - Screen parameters
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

/**
 * Go back to previous screen
 */
export function goBack() {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  }
}

/**
 * Reset navigation state
 * @param {object} state - New navigation state
 */
export function reset(state) {
  if (navigationRef.isReady()) {
    navigationRef.reset(state);
  }
}

/**
 * Push a new screen onto the stack
 * @param {string} name - Screen name
 * @param {object} params - Screen parameters
 */
export function push(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.current?.push(name, params);
  }
}

/**
 * Pop screens from the stack
 * @param {number} count - Number of screens to pop (default: 1)
 */
export function pop(count = 1) {
  if (navigationRef.isReady()) {
    navigationRef.current?.pop(count);
  }
}

/**
 * Get current route name
 * @returns {string|undefined} Current route name
 */
export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.name;
  }
  return undefined;
}

/**
 * Check if navigation is ready
 * @returns {boolean} Whether navigation is ready
 */
export function isReady() {
  return navigationRef.isReady();
}

export default navigationRef;
