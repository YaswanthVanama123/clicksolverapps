# Service Feature Module

## Overview

The Service feature module is organized into specialized controllers that handle different aspects of the service lifecycle. This modular architecture promotes code maintainability, testability, and scalability.

## Architecture

```
src/features/service/
├── index.js                          # Main entry point, exports all functions
├── service.controller.js             # Service catalog & discovery (346 lines, 12 functions)
├── service-tracking.controller.js    # Service tracking & monitoring (530 lines, 8 functions)
├── service-timer.controller.js       # Timer management (310 lines, 5 functions)
├── service-work.controller.js        # Work completion flow (433 lines, 7 functions)
└── service.helpers.js                # Shared utilities (195 lines, 6 functions)
```

## File Responsibilities

### 1. service.controller.js (Service Catalog)
**Purpose:** Manages service discovery, search, and catalog operations

**Functions:**
- `homeServices()` - Get aggregated home page services
- `getServices()` - Get all service categories
- `getElectricianServices()` - Get electrician-specific services
- `getPlumberServices()` - Get plumber-specific services
- `getCleaningServices()` - Get cleaning-specific services
- `getPaintingServices()` - Get painting-specific services
- `getVehicleServices()` - Get vehicle-related services
- `getIndividualServices()` - Get services by category
- `getServicesBySearch()` - Search services with scoring algorithm
- `getServiceByName()` - Get service details by name
- `subservices()` - Get sub-services for a main service
- `insertRelatedService()` - Add related services to database

**Key Features:**
- Smart search with keyword scoring
- Service categorization
- Related services management

### 2. service-tracking.controller.js (Tracking & Monitoring)
**Purpose:** Manages service tracking lifecycle from initiation to delivery

**Functions:**
- `insertTracking()` - Create new tracking record
- `getWorkerTrackingServices()` - Get worker's tracking services
- `getUserTrackingServices()` - Get user's tracking services
- `getAllTrackingServices()` - Get all tracking services (admin)
- `getServiceTrackingWorkerItemDetails()` - Get tracking details for worker
- `getServiceTrackingUserItemDetails()` - Get tracking details for user
- `serviceTrackingUpdateStatus()` - Update tracking status with FCM notifications
- `serviceDeliveryVerification()` - Verify delivery with OTP

**Key Features:**
- Real-time tracking updates
- FCM push notifications
- OTP-based delivery verification
- Multi-user support (worker/user perspectives)

### 3. service-timer.controller.js (Timer Management)
**Purpose:** Manages work time tracking and stopwatch functionality

**Functions:**
- `startStopwatch()` - Start timer for a service
- `stopStopwatch()` - Stop timer and calculate duration
- `getTimerValue()` - Get current timer value
- `CheckStartTime()` - Verify/create start time
- `TimeStart()` - Initialize timer in database

**Key Features:**
- Real-time time tracking
- Automatic time calculation
- Resume capability for interrupted timers

**Important Notes:**
- Uses global state (`activeNotifications`, `stopwatchInterval`)
- For production/distributed systems, consider using Redis or similar
- Currently designed for single-instance deployment

### 4. service-work.controller.js (Work Completion)
**Purpose:** Manages work completion flow and payment preparation

**Functions:**
- `workCompletedRequest()` - Send work completion notification to worker
- `workCompletionCancel()` - Cancel work completion request
- `serviceCompleted()` - Mark service as completed with full workflow
- `getWorkDetails()` - Get work details for payment
- `getServiceCompletedDetails()` - Get completed service information
- `userWorkerInProgressDetails()` - Get in-progress work details
- `getTimeDifferenceInIST()` - Calculate time difference (utility)

**Key Features:**
- Multi-stage completion workflow
- FCM notifications for all parties
- Payment preparation
- Transaction safety with database locks

### 5. service.helpers.js (Shared Utilities)
**Purpose:** Provides reusable helper functions across all service controllers

**Functions:**
- `updateWorkerAction()` - Update worker's current action/screen
- `getCurrentTimestamp()` - Get formatted current timestamp
- `formatTime()` - Format seconds to HH:MM:SS
- `parseTime()` - Parse HH:MM:SS to seconds
- `getTimeDifferenceInIST()` - Calculate time difference
- `sendFCMNotification()` - Send push notifications to multiple devices

**Key Features:**
- DRY principle implementation
- Centralized notification handling
- Time formatting utilities
- Error handling and logging

## Function Distribution Summary

| Controller | Lines of Code | Functions | Avg Lines/Function |
|------------|---------------|-----------|-------------------|
| service.controller.js | 346 | 12 | 29 |
| service-tracking.controller.js | 530 | 8 | 66 |
| service-timer.controller.js | 310 | 5 | 62 |
| service-work.controller.js | 433 | 7 | 62 |
| service.helpers.js | 195 | 6 | 33 |
| **Total** | **1,814** | **38** | **48** |

## Design Decisions

### Why Split into 4 Controllers?

1. **Single Responsibility Principle:** Each controller has a clear, focused purpose
2. **Maintainability:** Easier to locate and modify specific functionality
3. **Team Collaboration:** Multiple developers can work on different controllers
4. **Testing:** Isolated functionality is easier to test
5. **Code Navigation:** Reduced cognitive load when working on specific features

### Why Extract Helpers?

1. **Code Reuse:** Eliminates duplicate code (e.g., `updateWorkerAction` was in 2 files)
2. **Consistency:** Ensures consistent behavior across controllers
3. **Testing:** Helper functions can be unit tested independently
4. **Refactoring:** Easier to optimize common operations

### Why Keep Current Structure?

The current 4-controller split is **optimal** because:
- File sizes are manageable (310-530 lines)
- Clear separation of concerns
- No single file is overwhelming
- Functions are logically grouped

Further subdivision would likely create unnecessary complexity without significant benefits.

## Usage

### Importing Functions

```javascript
// Import specific functions
const { homeServices, getServiceByName } = require('./src/features/service');

// Import all
const serviceModule = require('./src/features/service');
```

### Example: Using Service Search

```javascript
const { getServicesBySearch } = require('./src/features/service');

// In route handler
router.get('/services', getServicesBySearch);
```

### Example: Using Timer Functions

```javascript
const { startStopwatch, stopStopwatch } = require('./src/features/service');

// Start timer
await startStopwatch(notificationId);

// Stop timer
const workerId = await stopStopwatch(notificationId);
```

## Dependencies

- **Firebase Admin SDK** - Push notifications
- **PostgreSQL** - Database operations
- **Express** - HTTP request handling

## Important Notes

### Missing Dependencies

The following functions are referenced but not defined in the service module:
- `createUserBackgroundAction()` - Should be imported from user module
- This is commented in the code with placeholders for proper import path

### Global State Warning

`service-timer.controller.js` uses global variables for stopwatch management:
```javascript
const activeNotifications = new Set();
let stopwatchInterval = null;
```

**For production/distributed systems:**
- Consider using Redis for shared state
- Implement proper synchronization
- Use distributed locks for timer management

### Path References

All controllers use relative paths to reference shared dependencies:
```javascript
const admin = require("../../../firebaseAdmin.js");
const client = require("../../../connection.js");
```

## Testing Recommendations

### Unit Tests
- Test each controller function independently
- Mock database and Firebase dependencies
- Test helper functions thoroughly

### Integration Tests
- Test complete service workflows
- Verify FCM notification delivery
- Test timer accuracy

### Load Tests
- Test stopwatch with multiple concurrent services
- Verify database performance with tracking operations
- Test FCM notification throughput

## Future Improvements

### High Priority
1. **Replace Global State:** Implement Redis-based timer management
2. **Import Missing Dependencies:** Properly wire up `createUserBackgroundAction`
3. **Error Handling:** Add structured error responses
4. **Input Validation:** Add request validation middleware

### Medium Priority
1. **Add JSDoc:** Complete documentation for all functions
2. **Add Tests:** Implement comprehensive test coverage
3. **Logging:** Implement structured logging (Winston/Bunyan)
4. **Metrics:** Add performance monitoring

### Low Priority
1. **TypeScript:** Consider TypeScript migration for type safety
2. **API Documentation:** Generate OpenAPI/Swagger docs
3. **Rate Limiting:** Add rate limiting for tracking endpoints
4. **Caching:** Implement caching for service catalog queries

## Conclusion

The current service module architecture is **well-structured and appropriately divided**. The 4-controller split with shared helpers provides:
- Clear separation of concerns
- Manageable file sizes
- Good maintainability
- Logical organization

No further subdivision is recommended. Focus should be on improving the implementation details (replacing global state, adding tests, improving error handling) rather than restructuring the architecture.
