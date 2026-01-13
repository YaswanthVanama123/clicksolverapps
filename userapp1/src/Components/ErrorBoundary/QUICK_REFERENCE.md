# ErrorBoundary Quick Reference

## Quick Import

```javascript
// Import ErrorBoundary
import ErrorBoundary from './Components/ErrorBoundary';

// Import with utilities
import ErrorBoundary, {
  logError,
  logNonFatalError,
  setUserContext,
  clearUserContext,
  logBreadcrumb,
  withErrorBoundary,
} from './Components/ErrorBoundary';
```

## Quick Usage

### Wrap Components
```jsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### HOC Wrapper
```javascript
export default withErrorBoundary(MyComponent);
```

### Log Errors
```javascript
try {
  riskyOperation();
} catch (error) {
  logError(error, 'Context Name', {key: 'value'});
}
```

### Set User
```javascript
// After login
setUserContext(userId, {email, name});

// After logout
clearUserContext();
```

### Breadcrumbs
```javascript
logBreadcrumb('User action', {screen: 'Home'});
```

## Test It

```javascript
import TestErrorBoundary from './Components/ErrorBoundary/TestErrorBoundary';

// In any screen
<TestErrorBoundary />
```

## Files Location

```
/src/Components/ErrorBoundary/
├── ErrorBoundary.js           ← Main component
├── FallbackComponent.js       ← Error UI
├── ErrorLogger.js             ← Logging utils
├── TestErrorBoundary.js       ← Test component
├── index.js                   ← Exports
├── README.md                  ← Full docs
├── IMPLEMENTATION_SUMMARY.md  ← Implementation details
└── QUICK_REFERENCE.md         ← This file
```

## Key Points

- ✅ Already integrated in App.tsx
- ✅ Catches all React rendering errors
- ✅ Dev mode shows detailed errors
- ✅ Production mode shows friendly UI
- ✅ Ready for Firebase Crashlytics
- ❌ Doesn't catch event handler errors (use try-catch)
- ❌ Doesn't catch async errors (use try-catch)

## Common Patterns

### Screen-Level Protection
```jsx
function MyScreen() {
  return (
    <ErrorBoundary>
      <ScreenContent />
    </ErrorBoundary>
  );
}
```

### Feature-Level Protection
```jsx
function MyFeature() {
  return (
    <View>
      <Header />
      <ErrorBoundary>
        <ComplexFeature />
      </ErrorBoundary>
      <Footer />
    </View>
  );
}
```

### API Error Logging
```javascript
const fetchData = async () => {
  try {
    const response = await api.get('/endpoint');
    return response.data;
  } catch (error) {
    logError(error, 'API Call', {
      endpoint: '/endpoint',
      method: 'GET',
    });
    throw error;
  }
};
```

### Custom Error Handler
```jsx
<ErrorBoundary
  onError={(error, info) => {
    console.log('Custom handling:', error);
  }}
  onReset={() => {
    console.log('Boundary reset');
  }}>
  <Component />
</ErrorBoundary>
```

## When to Use

### ✅ Use ErrorBoundary For:
- Protecting entire app (already done)
- Wrapping third-party components
- Protecting complex features
- Isolating risky sections

### ✅ Use logError For:
- API call errors
- Data processing errors
- Validation errors
- Business logic errors

### ✅ Use setUserContext For:
- After successful login
- When user data loads
- Tracking authenticated users

### ✅ Use logBreadcrumb For:
- Navigation events
- User interactions
- State changes
- Important operations

## Firebase Crashlytics Setup

When ready:

1. Install:
   ```bash
   npm install @react-native-firebase/crashlytics
   ```

2. Uncomment code in `ErrorLogger.js`

3. Test in production build

## More Info

See `README.md` for comprehensive documentation.
