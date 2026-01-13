/**
 * Formatting utility functions
 * Pure functions for formatting values for display
 */

/**
 * Formats number as Indian Rupee currency
 * @param {number} amount - Amount to format
 * @param {boolean} includeSymbol - Whether to include currency symbol (default: true)
 * @returns {string} Formatted currency string e.g., "₹1,234"
 */
export const formatCurrency = (amount, includeSymbol = true) => {
  if (typeof amount !== 'number' || isNaN(amount)) return includeSymbol ? '₹0' : '0';

  const symbol = includeSymbol ? '₹' : '';
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formatter.format(amount)}`;
};

/**
 * Formats phone number to standard Indian format
 * Input: 9876543210 or 919876543210
 * Output: +91 98765 43210
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return '';

  const cleaned = phone.replace(/\D/g, '');
  let formatted = cleaned;

  // If 10 digits, assume Indian number
  if (cleaned.length === 10) {
    formatted = `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  // If 12 digits starting with 91, format with country code
  else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    formatted = `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  // If 11 digits starting with 1, format with country code
  else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    formatted = `+1 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return formatted;
};

/**
 * Formats date according to specified format
 * Supported formats: 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MMM-YY'
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format string (default: 'DD/MM/YYYY')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const monthName = d.toLocaleString('en-IN', { month: 'short' });

    const formatMap = {
      'DD/MM/YYYY': `${day}/${month}/${year}`,
      'YYYY-MM-DD': `${year}-${month}-${day}`,
      'MM/DD/YYYY': `${month}/${day}/${year}`,
      'DD-MMM-YY': `${day}-${monthName}-${String(year).slice(-2)}`,
    };

    return formatMap[format] || formatMap['DD/MM/YYYY'];
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '';
  }
};

/**
 * Formats time in HH:MM or HH:MM:SS format
 * @param {Date|string|number} date - Date/time to format
 * @param {boolean} includeSeconds - Whether to include seconds (default: false)
 * @returns {string} Formatted time string e.g., "14:30" or "14:30:45"
 */
export const formatTime = (date, includeSeconds = false) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    if (includeSeconds) {
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }

    return `${hours}:${minutes}`;
  } catch (error) {
    console.warn('Time formatting error:', error);
    return '';
  }
};

/**
 * Formats date as relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const seconds = Math.floor((now - d) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) > 1 ? 's' : ''} ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;

    // For future dates
    if (seconds < 0) {
      const absDays = Math.abs(Math.floor(seconds / 86400));
      return `in ${absDays} day${absDays > 1 ? 's' : ''}`;
    }

    return formatDate(d);
  } catch (error) {
    console.warn('Relative time formatting error:', error);
    return '';
  }
};

/**
 * Truncates text to specified length and adds ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Formats file size to human-readable format
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted size string e.g., "1.5 MB"
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  if (typeof bytes !== 'number' || bytes < 0) return '';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (bytes / Math.pow(k, i)).toFixed(decimals) + ' ' + sizes[i];
};

/**
 * Formats percentage with specified decimal places
 * @param {number} value - Value to format as percentage
 * @param {number} total - Total value (default: 100)
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted percentage e.g., "75%"
 */
export const formatPercentage = (value, total = 100, decimals = 0) => {
  if (typeof value !== 'number' || typeof total !== 'number' || total === 0) return '';
  const percentage = (value / total) * 100;
  return percentage.toFixed(decimals) + '%';
};

/**
 * Capitalizes first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalizes first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Title-cased string
 */
export const titleCase = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.split(' ').map(word => capitalize(word)).join(' ');
};

/**
 * Masks sensitive information (e.g., credit card, phone)
 * @param {string} str - String to mask
 * @param {number} visibleChars - Number of characters to show at end
 * @returns {string} Masked string
 */
export const maskSensitive = (str, visibleChars = 4) => {
  if (!str || typeof str !== 'string' || str.length <= visibleChars) return str;
  const masked = '*'.repeat(str.length - visibleChars);
  return masked + str.slice(-visibleChars);
};

export default {
  formatCurrency,
  formatPhoneNumber,
  formatDate,
  formatTime,
  formatRelativeTime,
  truncateText,
  formatFileSize,
  formatPercentage,
  capitalize,
  titleCase,
  maskSensitive,
};
