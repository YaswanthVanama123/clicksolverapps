/**
 * Validation utility functions
 * Pure functions for validating user input and data
 */

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates phone number format (Indian phone numbers)
 * Accepts 10-digit numbers, with or without country code
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const cleanedPhone = phone.replace(/\D/g, '');
  // Check for 10 digits (Indian) or 12 digits (with country code 91)
  return cleanedPhone.length === 10 || (cleanedPhone.length === 12 && cleanedPhone.startsWith('91'));
};

/**
 * Validates Indian postal code (pincode)
 * Accepts 6-digit numbers
 * @param {string} pincode - Pincode to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validatePincode = (pincode) => {
  if (!pincode || typeof pincode !== 'string') return false;
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode.trim());
};

/**
 * Validates person name
 * Accepts letters, spaces, and hyphens; minimum 2 characters
 * @param {string} name - Name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const nameRegex = /^[a-zA-Z\s\-']{2,}$/;
  return nameRegex.test(name.trim());
};

/**
 * Validates geographic coordinates
 * @param {number} lat - Latitude (-90 to 90)
 * @param {number} lng - Longitude (-180 to 180)
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidLocation = (lat, lng) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Validates if a point is within a polygon using ray-casting algorithm
 * @param {Array} point - [longitude, latitude] coordinate
 * @param {Array} polygon - Array of [longitude, latitude] coordinates
 * @returns {boolean} True if point is inside polygon
 */
export const isPointInPolygon = (point, polygon) => {
  if (!point || !polygon || polygon.length < 3) return false;

  const x = point[1]; // latitude
  const y = point[0]; // longitude
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Validates if string is not empty after trimming
 * @param {string} str - String to validate
 * @returns {boolean} True if not empty
 */
export const isNotEmpty = (str) => {
  return typeof str === 'string' && str.trim().length > 0;
};

/**
 * Validates minimum length of string
 * @param {string} str - String to validate
 * @param {number} minLength - Minimum length required
 * @returns {boolean} True if valid
 */
export const hasMinLength = (str, minLength) => {
  return typeof str === 'string' && str.trim().length >= minLength;
};

/**
 * Validates maximum length of string
 * @param {string} str - String to validate
 * @param {number} maxLength - Maximum length allowed
 * @returns {boolean} True if valid
 */
export const hasMaxLength = (str, maxLength) => {
  return typeof str === 'string' && str.trim().length <= maxLength;
};

/**
 * Validates if number is in range
 * @param {number} num - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if in range
 */
export const isInRange = (num, min, max) => {
  return typeof num === 'number' && num >= min && num <= max;
};

/**
 * Validates positive number
 * @param {number} num - Number to validate
 * @returns {boolean} True if positive
 */
export const isPositive = (num) => {
  return typeof num === 'number' && num > 0;
};

/**
 * Validates non-negative number
 * @param {number} num - Number to validate
 * @returns {boolean} True if non-negative
 */
export const isNonNegative = (num) => {
  return typeof num === 'number' && num >= 0;
};

/**
 * Validates if string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export const isValidURL = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default {
  validateEmail,
  validatePhone,
  validatePincode,
  validateName,
  isValidLocation,
  isPointInPolygon,
  isNotEmpty,
  hasMinLength,
  hasMaxLength,
  isInRange,
  isPositive,
  isNonNegative,
  isValidURL,
};
