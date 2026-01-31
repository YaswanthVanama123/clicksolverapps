# Service Module Architecture Diagram

## Module Structure

```
┌────────────────────────────────────────────────────────────────────┐
│                        Service Feature Module                       │
│                         (index.js - 124 lines)                      │
│                                                                      │
│  Exports 38 functions from 4 controllers + 6 helper functions       │
└────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────────┐      ┌──────────────────┐       ┌──────────────────┐
│  Service Catalog │      │ Service Tracking │       │  Service Timer   │
│   Controller     │      │    Controller    │       │   Controller     │
│  (346 lines)     │      │   (531 lines)    │       │  (291 lines)     │
│                  │      │                  │       │                  │
│  12 Functions:   │      │  8 Functions:    │       │  5 Functions:    │
│  - homeServices  │      │  - insertTracking│       │  - startStopwatch│
│  - getServices   │      │  - getWorker...  │       │  - stopStopwatch │
│  - getElectric...│      │  - getUser...    │       │  - getTimerValue │
│  - getPlumber... │      │  - getAll...     │       │  - CheckStartTime│
│  - getCleaning...│      │  - getService... │       │  - TimeStart     │
│  - getPainting...│      │  - service...    │       │                  │
│  - getVehicle... │      │  - delivery...   │       │  Global State:   │
│  - getIndividual │      │                  │       │  - active...     │
│  - getServices...│      │  FCM Integration │       │  - stopwatch...  │
│  - getServiceBy..│      │  OTP Verification│       │                  │
│  - subservices   │      │                  │       │  ⚠️  Redis needed│
│  - insertRelated │      │                  │       │  for production  │
└────────┬─────────┘      └────────┬─────────┘       └────────┬─────────┘
         │                         │                          │
         │                         │                          │
         │                         ▼                          │
         │                ┌──────────────────┐                │
         │                │  Service Work    │                │
         │                │   Controller     │                │
         │                │  (432 lines)     │                │
         │                │                  │                │
         │                │  7 Functions:    │                │
         │                │  - workCompleted │                │
         │                │  - workComple... │                │
         │                │  - serviceCom... │                │
         │                │  - getWorkDet... │                │
         │                │  - getService... │                │
         │                │  - userWorker... │                │
         │                │  - getTimeDif... │                │
         └────────────────┴────────┬─────────┴────────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │ Service Helpers  │
                         │  (178 lines)     │
                         │                  │
                         │  6 Functions:    │
                         │  - updateWorker  │
                         │  - getCurrentTS  │
                         │  - formatTime    │
                         │  - parseTime     │
                         │  - getTimeDiff   │
                         │  - sendFCM       │
                         └──────────────────┘
```

## Data Flow Diagram

### Service Discovery Flow
```
User Request
    │
    ▼
homeServices() / getServicesBySearch()
    │
    ▼
PostgreSQL Query (services, allservices tables)
    │
    ▼
Score & Filter Results
    │
    ▼
Return to User
```

### Service Tracking Flow
```
Worker Action: "Collected Item"
    │
    ▼
insertTracking()
    │
    ├─► Insert tracking record (PostgreSQL)
    ├─► Generate tracking PIN & Key
    ├─► Update worker/user actions
    │   (via updateWorkerAction helper)
    └─► Send FCM notification
        (via sendFCMNotification helper)
            │
            ▼
        User receives notification
            │
            ▼
    User tracks service via tracking_key
            │
            ▼
    serviceTrackingUpdateStatus()
            │
            ▼
    Real-time status updates
            │
            ▼
    serviceDeliveryVerification()
            │
            ▼
        OTP verification
            │
            ▼
        Service marked complete
```

### Timer Management Flow
```
Service Starts
    │
    ▼
startStopwatch(notificationId)
    │
    ├─► Check if already running
    ├─► Create/retrieve ServiceCall record
    ├─► Add to activeNotifications Set
    └─► Start interval timer (1 sec)
            │
            ▼
    Update time_worked every second
            │
            ▼
    Service completes
            │
            ▼
stopStopwatch(notificationId)
    │
    ├─► Clear interval
    ├─► Update end_time
    ├─► Calculate final duration
    └─► Send completion FCM
            │
            ▼
        Timer stopped
```

### Work Completion Flow
```
User: "Work Complete?"
    │
    ▼
workCompletedRequest()
    │
    └─► Send FCM to worker
            │
            ▼
    Worker reviews work
            │
            ▼
serviceCompleted(notification_id, encodedId)
    │
    ├─► BEGIN TRANSACTION
    ├─► Update servicecall (end_time, time_worked)
    ├─► Update accepted (time.workCompleted)
    ├─► Get user FCM tokens
    ├─► COMMIT TRANSACTION
    │
    ├─► Send FCM to user
    ├─► Update worker action
    └─► Update user background action
            │
            ▼
    Navigate to Payment Screen
```

## Database Interactions

### Tables Used

```
┌─────────────────────────────────────────────────────────┐
│ Service Catalog Tables                                   │
├─────────────────────────────────────────────────────────┤
│ - services                (service categories)           │
│ - servicecategories       (main categories)              │
│ - allservices            (detailed service list)         │
│ - relatedservices        (service relationships)         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Service Tracking Tables                                  │
├─────────────────────────────────────────────────────────┤
│ - servicetracking        (tracking records)              │
│ - accepted               (accepted jobs)                 │
│ - usernotifications      (user notification records)     │
│ - userfcm                (user FCM tokens)               │
│ - fcm                    (worker FCM tokens)             │
│ - workeraction           (worker current screen)         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Service Work Tables                                      │
├─────────────────────────────────────────────────────────┤
│ - servicecall            (work time tracking)            │
│ - completenotifications  (completed services)            │
│ - user                   (user profile)                  │
│ - workersverified        (verified worker profiles)      │
│ - workerskills           (worker skills & profiles)      │
└─────────────────────────────────────────────────────────┘
```

## External Dependencies

```
┌──────────────────────────────────────────────────────┐
│              External Services                        │
└──────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Firebase   │ │  PostgreSQL  │ │   Express    │
│    Admin     │ │   Database   │ │   Router     │
│              │ │              │ │              │
│ - FCM Push   │ │ - CRUD Ops   │ │ - HTTP API   │
│ - Firestore  │ │ - Queries    │ │ - Middleware │
│              │ │ - Txns       │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Function Call Relationships

```
Service Completion Workflow:
═══════════════════════════════

workCompletedRequest()
    │
    └─► sendFCMNotification()
            │
            ▼
    Worker confirms completion
            │
            ▼
serviceCompleted()
    │
    ├─► updateWorkerAction()
    └─► sendFCMNotification()
            │
            ▼
getWorkDetails()
    │
    └─► Return payment details
            │
            ▼
getServiceCompletedDetails()
    │
    └─► Return final service info
```

```
Tracking Workflow:
═══════════════════

insertTracking()
    │
    ├─► updateWorkerAction()
    └─► sendFCMNotification()
            │
            ▼
serviceTrackingUpdateStatus()
    │
    └─► sendFCMNotification()
            │
            ▼
serviceDeliveryVerification()
    │
    └─► OTP validation
            │
            ▼
Service delivered
```

## File Size Distribution

```
Total: 1,902 lines across 6 files

service-tracking.controller.js  ████████████████████░░  531 lines (28%)
service-work.controller.js      ████████████████░░░░░░  432 lines (23%)
service.controller.js           ██████████████░░░░░░░░  346 lines (18%)
service-timer.controller.js     ███████████░░░░░░░░░░░  291 lines (15%)
service.helpers.js              ███████░░░░░░░░░░░░░░░  178 lines (9%)
index.js                        ████░░░░░░░░░░░░░░░░░░  124 lines (7%)
```

## Optimization Opportunities

### High Priority
```
┌──────────────────────────────────────────────────────┐
│ 1. Replace Global State in service-timer.controller │
│    Current: JavaScript Set/variable                  │
│    Recommended: Redis with TTL                       │
│    Impact: Enables horizontal scaling                │
└──────────────────────────────────────────────────────┘
```

### Medium Priority
```
┌──────────────────────────────────────────────────────┐
│ 2. Import createUserBackgroundAction                 │
│    Current: Commented out                            │
│    Recommended: Proper import from user module       │
│    Impact: Complete functionality                    │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ 3. Add Request Validation                            │
│    Current: Basic checks                             │
│    Recommended: Joi/Yup validation middleware        │
│    Impact: Better error handling                     │
└──────────────────────────────────────────────────────┘
```

### Low Priority
```
┌──────────────────────────────────────────────────────┐
│ 4. Cache Service Catalog                             │
│    Current: Database query each time                 │
│    Recommended: Redis cache with invalidation        │
│    Impact: Reduced database load                     │
└──────────────────────────────────────────────────────┘
```

## Conclusion

The service module architecture is well-organized with:
- ✅ Clear separation of concerns
- ✅ Manageable file sizes (178-531 lines)
- ✅ Logical grouping of functionality
- ✅ Shared utilities for code reuse
- ⚠️  Global state that needs Redis for production
- ⚠️  Missing dependencies that need wiring

**Recommendation: No further subdivision needed. Focus on implementation improvements.**
