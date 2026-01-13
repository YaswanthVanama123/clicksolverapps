# ErrorBoundary - Error Handling for React Native

## Overview

The ErrorBoundary component provides a robust error handling system for the userapp1 React Native application. It catches JavaScript errors anywhere in the component tree, logs error information, and displays a user-friendly fallback UI.

## Features

- **Catch React Errors**: Automatically catches rendering errors in child components
- **User-Friendly UI**: Displays an elegant error screen using the existing ErrorState component
- **Development Mode**: Shows detailed error information (stack traces, component stack) in `__DEV__` mode
- **Error Logging**: Console logging in development, ready for Firebase Crashlytics integration
- **Retry Functionality**: Allows users to attempt recovery by retrying
- **Theme Integration**: Uses the app's theme system for consistent styling

## Structure

```
/src/Components/ErrorBoundary/
├── ErrorBoundary.js        # Main error boundary class component
├── FallbackComponent.js    # Error UI with theme integration
├── ErrorLogger.js          # Error logging utility (Crashlytics-ready)
├── index.js               # Exports
└── README.md              # This file
```

## Usage

### Basic Usage (Already Implemented)

The ErrorBoundary is already wrapping the entire app in `App.tsx`:

```tsx
import ErrorBoundary from './Components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NavigationContainer>
          {/* Your app content */}
        </NavigationContainer>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

### Wrapping Specific Components

You can also wrap specific components for granular error handling:

```javascript
import ErrorBoundary from './Components/ErrorBoundary';

function MyScreen() {
  return (
    <View>
      <Header />
      <ErrorBoundary>
        <RiskyComponent />
      </ErrorBoundary>
      <Footer />
    </View>
  );
}
```

### Using the HOC

Wrap a component with the `withErrorBoundary` HOC:

```javascript
import {withErrorBoundary} from './Components/ErrorBoundary';

const MyComponent = () => {
  // Component code
};

export default withErrorBoundary(MyComponent);
```

### Custom Error Handlers

```javascript
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom error handling
    console.log('Custom handler:', error);
  }}
  onReset={() => {
    // Custom reset logic
    console.log('Error boundary reset');
  }}>
  <YourComponent />
</ErrorBoundary>
```

### Custom Fallback UI

```javascript
import {ErrorBoundary} from './Components/ErrorBoundary';

const CustomFallback = ({error, resetError}) => (
  <View>
    <Text>Custom Error UI</Text>
    <Button title="Reset" onPress={resetError} />
  </View>
);

<ErrorBoundary FallbackComponent={CustomFallback}>
  <YourComponent />
</ErrorBoundary>;
```

## Error Logging

### Basic Logging

The ErrorLogger provides functions for logging errors:

```javascript
import {logError, logNonFatalError} from './Components/ErrorBoundary';

// Log an error
try {
  // risky operation
} catch (error) {
  logError(error, 'API Call', {
    endpoint: '/users',
    method: 'GET',
  });
}

// Log a custom non-fatal error
logNonFatalError('Invalid user input', {
  field: 'email',
  value: userInput,
});
```

### Setting User Context

Set user information for error tracking:

```javascript
import {setUserContext, clearUserContext} from './Components/ErrorBoundary';

// On login
setUserContext(user.id, {
  email: user.email,
  name: user.name,
});

// On logout
clearUserContext();
```

### Breadcrumbs

Log breadcrumbs for debugging:

```javascript
import {logBreadcrumb} from './Components/ErrorBoundary';

logBreadcrumb('User navigated to profile', {screen: 'Profile'});
logBreadcrumb('API call started', {endpoint: '/api/services'});
```

## Firebase Crashlytics Integration

To enable Firebase Crashlytics (when ready):

1. **Install Firebase Crashlytics**:

   ```bash
   npm install @react-native-firebase/crashlytics
   ```

2. **Configure Firebase** in your project (follow Firebase setup docs)

3. **Uncomment Crashlytics Code** in `ErrorLogger.js`:

   ```javascript
   // Uncomment this line at the top
   import crashlytics from '@react-native-firebase/crashlytics';

   // Uncomment the Crashlytics sections in:
   // - logError()
   // - setUserContext()
   // - clearUserContext()
   // - logBreadcrumb()
   ```

4. **Test in Production Build** (Crashlytics doesn't work in dev mode)

## Development Features

### Dev Mode Error Details

When `__DEV__` is true, the error screen shows:

- Error type and name
- Error message
- Component stack trace
- Full stack trace
- Platform information
- Expandable/collapsible details

### Production Mode

In production builds:

- Shows user-friendly error message only
- No technical details exposed
- Logs errors to Crashlytics (when configured)
- Maintains professional appearance

## Components Reference

### ErrorBoundary

**Props:**

- `FallbackComponent` (Component): Custom fallback component
- `onError` (function): Called when error is caught
- `onReset` (function): Called when error boundary is reset

**Methods:**

- `resetError()`: Resets the error boundary state

### FallbackComponent

**Props:**

- `error` (Error): The error object
- `resetError` (function): Function to reset error boundary
- `errorInfo` (string): Component stack trace

### ErrorLogger

**Functions:**

- `logError(error, context, additionalInfo)`: Log an error
- `logNonFatalError(message, context)`: Log a non-fatal error
- `setUserContext(userId, userInfo)`: Set user context for tracking
- `clearUserContext()`: Clear user context
- `logBreadcrumb(message, data)`: Log a breadcrumb

## Best Practices

1. **Wrap at the Root**: The app-level ErrorBoundary catches all uncaught errors
2. **Granular Boundaries**: Add ErrorBoundaries around critical or risky sections
3. **Log Context**: Always provide context when logging errors
4. **User Context**: Set user context after authentication
5. **Clear Context**: Clear user context on logout
6. **Breadcrumbs**: Use breadcrumbs to track user journey before errors
7. **Test Errors**: Test error boundaries in development to ensure they work

## Testing ErrorBoundary

To test if the ErrorBoundary works, you can create a test component:

```javascript
const TestErrorComponent = () => {
  const [throwError, setThrowError] = React.useState(false);

  if (throwError) {
    throw new Error('Test error from ErrorBoundary');
  }

  return (
    <Button title="Throw Error" onPress={() => setThrowError(true)} />
  );
};

// Use it in your app:
<ErrorBoundary>
  <TestErrorComponent />
</ErrorBoundary>;
```

## What ErrorBoundary Doesn't Catch

ErrorBoundary cannot catch:

- Event handlers (use try-catch)
- Asynchronous code (use try-catch or .catch())
- Server-side rendering errors
- Errors in the error boundary itself

For these cases, use regular try-catch blocks and the `logError` function.

## Theme Integration

The FallbackComponent uses:

- Theme colors from `src/theme/colors`
- ErrorState component from `src/Components/molecules/ErrorState`
- ThemeContext for dark mode support

## Support

For issues or questions about ErrorBoundary:

1. Check this README
2. Review the component source code
3. Check React Native Error Boundary documentation
4. Check Firebase Crashlytics documentation (for production logging)

## Future Enhancements

Potential improvements:

- [ ] Automatic error recovery for specific error types
- [ ] Error analytics dashboard integration
- [ ] Custom error categorization
- [ ] Network error auto-retry mechanism
- [ ] Error reporting UI for users to submit feedback
- [ ] Sentry or other error tracking service integration

## License

Part of the userapp1 React Native application.
