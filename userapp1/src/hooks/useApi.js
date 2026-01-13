import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Generic hook for API calls with loading, error states, and manual execution
 *
 * @param {Function} apiFunction - Async function that makes the API call
 * @param {Object} options - Configuration options
 * @param {boolean} options.immediate - Whether to execute immediately on mount (default: false)
 * @param {Function} options.onSuccess - Callback on successful API call
 * @param {Function} options.onError - Callback on API error
 *
 * @returns {Object} API state and control methods
 * @property {any} data - Response data from the API
 * @property {boolean} loading - Loading state
 * @property {Error|null} error - Error object if request failed
 * @property {Function} execute - Manually trigger the API call
 * @property {Function} reset - Reset state to initial values
 */
const useApi = (apiFunction, options = {}) => {
  const {
    immediate = false,
    onSuccess = null,
    onError = null,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  /**
   * Execute the API function
   * @param {...any} params - Parameters to pass to the API function
   * @returns {Promise<any>} The API response data
   */
  const execute = useCallback(
    async (...params) => {
      try {
        // Cancel previous request if still pending
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        const result = await apiFunction(...params);

        if (isMountedRef.current) {
          setData(result);
          setLoading(false);

          if (onSuccess && typeof onSuccess === 'function') {
            onSuccess(result);
          }
        }

        return result;
      } catch (err) {
        if (isMountedRef.current) {
          const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
          const errorObject = {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data,
            originalError: err,
          };

          setError(errorObject);
          setLoading(false);

          if (onError && typeof onError === 'function') {
            onError(errorObject);
          }
        }

        throw err;
      }
    },
    [apiFunction, onSuccess, onError]
  );

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setData(null);
      setError(null);
      setLoading(false);
    }
  }, []);

  /**
   * Cancel ongoing request
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  }, []);

  // Execute immediately if specified
  useEffect(() => {
    if (immediate) {
      execute();
    }

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    cancel,
  };
};

export default useApi;
