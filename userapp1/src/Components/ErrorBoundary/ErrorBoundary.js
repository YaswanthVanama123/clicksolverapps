/**
 * ErrorBoundary - React Error Boundary Component
 *
 * Purpose:
 * - Catch JavaScript errors anywhere in the component tree
 * - Log error information for debugging and monitoring
 * - Display fallback UI when errors occur
 * - Provide recovery mechanism (reset/retry)
 *
 * Usage:
 * Wrap your app or specific components:
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 *
 * With custom fallback:
 * <ErrorBoundary FallbackComponent={CustomFallback}>
 *   <YourComponent />
 * </ErrorBoundary>
 */

import React, {Component} from 'react';
import {View, StyleSheet} from 'react-native';
import FallbackComponent from './FallbackComponent';
import {logError} from './ErrorLogger';

/**
 * ErrorBoundary Class Component
 * Catches errors in child components and displays fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   * This is called during the render phase
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state
   */
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: error,
    };
  }

  /**
   * Log error details
   * This is called during the commit phase
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Object with componentStack
   */
  componentDidCatch(error, errorInfo) {
    // Log error to console and crash reporting service
    logError(error, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack,
      errorInfo: errorInfo,
    });

    // Update state with error info for display in dev mode
    this.setState({
      errorInfo: errorInfo.componentStack,
    });

    // Call optional error handler from props
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset error boundary state
   * Called when user clicks "Try Again"
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call optional reset handler from props
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided, otherwise use default
      const FallbackUI = this.props.FallbackComponent || FallbackComponent;

      return (
        <View style={styles.container}>
          <FallbackUI
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
          />
        </View>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

/**
 * HOC to wrap a component with ErrorBoundary
 * @param {Component} Component - Component to wrap
 * @param {Object} errorBoundaryProps - Props for ErrorBoundary
 * @returns {Component} Wrapped component
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

export default ErrorBoundary;
