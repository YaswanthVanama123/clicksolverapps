# API Routes Documentation

This document provides a comprehensive visualization of all API endpoints in the ClickSolver backend application, organized by feature modules.

**Last Updated:** 2026-01-28

---

## Table of Contents

1. [Authentication Routes](#authentication-routes)
2. [User Routes](#user-routes)
3. [Worker Routes](#worker-routes)
4. [Service Routes](#service-routes)
5. [Booking Routes](#booking-routes)
6. [Payment Routes](#payment-routes)
7. [Tracking Routes](#tracking-routes)
8. [Messaging Routes](#messaging-routes)
9. [Admin Routes](#admin-routes)

---

## Authentication Routes

**Module:** `src/features/auth/routes/auth.routes.js`

### Login Endpoints
```
POST    /login                          → login
        Authenticate user with credentials

POST    /user/login                     → login (alias)
        User login

POST    /worker/login                   → Partnerlogin
        Worker/Partner login

GET     /admin/login                    → adminLogin
        Admin login
```

### OTP Management
```
POST    /otp/send                       → sendOtp
        Send OTP to user phone

POST    /partner/otp/send               → partnerSendOtp
        Send OTP to partner phone

POST    /partner/sendOtp                → partnerSendOtp (alias)
        Send OTP to partner (alternate endpoint)

POST    /worker/sendOtp                 → WorkerSendOtp
        Send OTP to worker phone

GET     /validate                       → validateOtp
        Validate OTP for user (query params required)

GET     /partner/validateOtp            → partnerValidateOtp
        Validate OTP for partner (query params required)

GET     /worker/validateOtp             → WorkerValidateOtp
        Validate OTP for worker (query params required)

POST    /otp-verify                     → verifyOTP
        Verify OTP and return token
```

### PIN & Token Verification
```
POST    /pin/verification               → workerVerifyOtp
        [AUTH] authenticateToken
        Verify PIN (OTP verification for users)

POST    /worker/token/verification      → workerTokenVerification
        [AUTH] authenticateWorkerToken
        Verify worker token validity

POST    /validate-token                 → [Inline]
        [AUTH] authenticateToken
        Validate authentication token
```

### SMS & Logout
```
POST    /send-sms                       → sendSMSVerification
        Send SMS verification code

POST    /userLogout                     → userLogout
        User logout (clear session)

POST    /workerLogout                   → workerLogout
        Worker logout (clear session)
```

### Account & Status Management
```
POST    /user/details/delete            → accountDelete
        [AUTH] authenticateToken
        Delete user account permanently

GET     /step-status                    → checkOnboardingStatus
        [AUTH] authenticateWorkerToken
        Check worker onboarding step status

POST    /registration/status            → registrationStatus
        [AUTH] authenticateWorkerToken
        Get worker registration status

GET     /user/login/status              → loginStatus
        [AUTH] authenticateToken
        Get user login status
```

---

## User Routes

### User Profile Management

**Module:** `src/features/user/routes/user-profile.routes.js`

```
POST    /register                       → registerUser
        Register new user

POST    /user/signup                    → userCompleteSignUp
        Complete user signup process

POST    /user/profile                   → userProfileDetails
        [AUTH] authenticateToken
        Get user profile details

POST    /user/details/update            → accountDetailsUpdate
        [AUTH] authenticateToken
        Update user account details

POST    /user/updateProfileImage        → userProfileUpdate
        [AUTH] authenticateToken
        Update user profile image

GET     /get/user                       → getUserById
        [AUTH] authenticateToken
        Get user information by ID

POST    /user/feedback                  → submitFeedback
        [AUTH] authenticateToken
        Submit user feedback/rating
```

### User Bookings

**Module:** `src/features/user/routes/user-booking.routes.js`

```
GET     /user/bookings                  → getUserAllBookings
        [AUTH] authenticateToken
        Retrieve all user bookings (completed and in progress)

GET     /user/ongoingBookings           → getUserOngoingBookings
        [AUTH] authenticateToken
        Retrieve user's ongoing bookings

POST    /user/cancellation              → cancelRequest
        Cancel a booking request before acceptance

POST    /user/work/cancel               → userNavigationCancel
        Cancel an accepted booking
```

### User Location

**Module:** `src/features/user/routes/user-location.routes.js`

```
POST    /user/location                  → storeUserLocation
        [AUTH] authenticateToken
        Store user location (longitude and latitude)

POST    /user/store-fcm-token           → storeUserFcmToken
        [AUTH] authenticateToken
        Store FCM token for push notifications

GET     /user/address/details           → getUserAddressDetails
        Retrieve user address details from a notification
```

### User Actions

**Module:** `src/features/user/routes/user-action.routes.js`

```
POST    /user/action                    → createUserAction
        [AUTH] authenticateToken
        Create a new user action for tracking

POST    /user/action/cancel             → userActionRemove
        [AUTH] authenticateToken
        Cancel a user action

GET     /user/track/details             → getUserTrackRoute
        [AUTH] authenticateToken
        Fetch user tracking details and route information

POST    /user/tryping/cancel            → userCancelNavigation
        [AUTH] authenticateToken
        Cancel user navigation/typing action

POST    /user/active/update             → userActionRemove
        [AUTH] authenticateToken
        Update user's last active timestamp
```

### User Offers

**Module:** `src/features/user/routes/user-offer.routes.js`

```
POST    /user/coupons                   → userCoupons
        [AUTH] authenticateToken
        User coupons management

GET     /user/referrals                 → userReferrals
        [AUTH] authenticateToken
        Get user referral information

GET     /user/offers                    → fetchOffers
        [AUTH] authenticateToken
        Fetch available offers for the user

POST    /user/validate-offer            → offerValidation
        [AUTH] authenticateToken
        Validate and apply an offer/coupon for user
```

### User Notifications

**Module:** `src/features/user/routes/user-notification.routes.js`

```
GET     /user/notifications             → getUserNotifications
        [AUTH] authenticateToken
        Fetch all user notifications
        Query: fcmToken (required)

POST    /user/store-notification        → storeUserNotification
        [AUTH] authenticateToken
        Store a new user notification
```

---

## Worker Routes

### Worker Profile Management

**Module:** `src/features/worker/routes/worker-profile.routes.js`

```
POST    /add/worker                     → addWorker
        Add a new worker

POST    /worker/profile                 → workerProfileScreenDetails
        [AUTH] authenticateWorkerToken
        Get worker profile screen details

POST    /profile                        → workerProfileDetails
        [AUTH] authenticateWorkerToken
        Get worker profile details with ratings

GET     /profile/detsils                → getWorkerProfileDetails
        [AUTH] authenticateWorkerToken
        Get worker profile details from workerskills

GET     /worker/profile/details         → getWorkerProfleDetails
        [AUTH] authenticateWorkerToken
        Get worker profile details from workersverified

POST    /worker/updateProfileImage      → workerProfileUpdate
        [AUTH] authenticateWorkerToken
        Update worker profile image

POST    /profile/changes/submit         → profileChangesSubmit
        [AUTH] authenticateWorkerToken
        Submit profile changes with form data

GET     /worker/verification/status     → getVerificationStatus
        Get worker verification status (public endpoint)

GET     /worker/ratings                 → getWorkerReviewDetails
        [AUTH] authenticateWorkerToken
        Get worker review ratings

POST    /worker/details/rating          → workerProfileDetails
        Get worker details with rating information

POST    /worker/message                 → workerMessage
        Send or store worker message
```

### Worker Onboarding

**Module:** `src/features/worker/routes/worker-onboarding.routes.js`

```
POST    /worker/signup                  → workerCompleteSignUp
        Complete worker signup with phone number and name

GET     /step-status                    → [Inline]
        Check the current onboarding status for a worker
        [AUTH] authenticateWorkerToken

POST    /worker/skill/registration/filled → skillWorkerRegistration
        [AUTH] authenticateWorkerToken
        Submit filled skill registration form

GET     /worker/categories              → getServicesPhoneNumber
        [AUTH] authenticateWorkerToken
        Fetch service categories for authenticated worker

GET     /worker/categories/registration → getServicesRegisterPhoneNumber
        [AUTH] authenticateWorkerToken
        Fetch service categories for worker registration flow

POST    /worker/registration/submit     → registrationSubmit
        [AUTH] authenticateWorkerToken
        Submit complete worker registration form

POST    /worker/step-status             → onboardingSteps
        [AUTH] authenticateWorkerToken
        Check onboarding completion status (step 1-3)
```

### Worker Bookings

**Module:** `src/features/worker/routes/worker-booking.routes.js`

```
GET     /worker/bookings                → getWorkerBookings
        [AUTH] authenticateWorkerToken
        Retrieve all bookings for a worker

GET     /worker/ongoingBookings         → getWorkerOngoingBookings
        [AUTH] authenticateWorkerToken
        Retrieve ongoing bookings for a worker

GET     /worker/life/details            → workerLifeDetails
        [AUTH] authenticateWorkerToken
        Retrieve worker lifetime details and statistics

GET     /worker/service/history         → getWorkerServiceHistory
        Retrieve service history for a worker

GET     /worker/current/service         → currentService
        Retrieve current service details for a worker

POST    /worker/work/cancel             → workerNavigationCancel
        [AUTH] authenticateWorkerToken
        Cancel an ongoing work/service booking
```

### Worker Location

**Module:** `src/features/worker/routes/worker-location.routes.js`

```
POST    /worker/location                → storeWorkerLocation
        Store worker location (longitude, latitude, workerId)

POST    /worker/location/update         → updateWorkerLocation
        [AUTH] authenticateWorkerToken
        Update authenticated worker's location

POST    /worker/navigation/details      → getWorkerNavigationDetails
        Retrieve worker navigation details

GET     /worker/track/details           → getWorkerTrackRoute
        [AUTH] authenticateWorkerToken
        Retrieve worker track route details

POST    /worker/tryping/cancel          → workerCancelNavigation
        Cancel worker navigation

POST    /worker/workers-nearby          → getWorkersNearby
        [AUTH] authenticateToken (User token)
        Find workers nearby for a service request
```

### Worker Financial

**Module:** `src/features/worker/routes/worker-financial.routes.js`

```
POST    /worker/account/submit          → addBankAccount
        [AUTH] authenticateWorkerToken
        Submit and verify bank account details

POST    /worker/account/fund_account    → createFundAccount
        [AUTH] authenticateWorkerToken
        Create a fund account for bank transfers via Razorpay

POST    /worker/upi/submit              → validateAndSaveUPI
        [AUTH] authenticateWorkerToken
        Submit and validate UPI ID

POST    /worker/worker/earnings         → getWorkerEarnings
        [AUTH] authenticateWorkerToken
        Retrieve worker earnings for a specific date or date range

POST    /worker/balance/ammount         → balanceAmmountToPay
        [AUTH] authenticateWorkerToken
        Retrieve balance amount payable to worker

POST    /worker/worker/pending/balance  → getWorkerBalanceDetails
        Retrieve pending balance details for a worker

GET     /worker/worker/balance/history  → balanceHistory
        Retrieve balance payment history for a worker

POST    /worker/worker/pending/cashback → getWorkerCashbackDetails
        Retrieve pending cashback details for a worker

POST    /worker/worker/cashback/payed   → workerCashbackPayed
        Mark cashback as paid and update worker records

GET     /worker/worker/cashback/history → cashbackHistory
        Retrieve cashback history for a worker

GET     /worker/workers/pending/cashback → getWorkersPendingCashback
        Retrieve all workers with pending cashback

GET     /worker/pending/balance/workers → pendingBalanceWorkers
        Retrieve all workers with pending balance
```

### Worker Notifications

**Module:** `src/features/worker/routes/worker-notification.routes.js`

```
POST    /worker/store-fcm-token         → storeFcmToken
        [AUTH] authenticateWorkerToken
        Store or update FCM token for a worker

POST    /worker/store-notification      → storeNotification
        [AUTH] authenticateWorkerToken
        Store a notification for a worker

GET     /worker/notifications           → getWorkerNotifications
        [AUTH] authenticateWorkerToken
        Retrieve all notifications for the authenticated worker
```

### Worker Actions

**Module:** `src/features/worker/routes/worker-action.routes.js`

```
POST    /worker/worker/action           → createWorkerAction
        [AUTH] authenticateWorkerToken
        Create a worker action for tracking and navigation

POST    /worker/worker/screen/change    → workerScreenChange
        [AUTH] authenticateWorkerToken
        Update worker screen and track route changes

GET     /worker/worker/search           → workerSearch
        [AUTH] authenticateWorkerToken
        Search for workers based on criteria
```

---

## Service Routes

### Service Catalog

**Module:** `src/features/service/routes/service-catalog.routes.js`

```
GET     /home/services                  → homeServices
        Fetch all services available on the home page

POST    /single/service                 → getServiceByName
        Get details for a single service by name

GET     /servicecategories              → getServices
        Fetch all service categories

GET     /electrician/services           → getElectricianServices
        Fetch all electrician services

GET     /plumber/services               → getPlumberServices
        Fetch all plumber services

GET     /cleaning/services              → getCleaningServices
        Fetch all cleaning services

GET     /painting/services              → getPaintingServices
        Fetch all painting services

GET     /vehicle/services               → getVehicleServices
        Fetch all vehicle services

POST    /individual/service             → getIndividualServices
        Fetch individual service details

GET     /services                       → getServicesBySearch
        Search for services by query parameters

POST    /subservice/checkboxes          → subservices
        Get subservices with checkbox options

POST    /relatedservices                → insertRelatedService
        Insert or manage related services

GET     /special/offers                 → getSpecialOffers
        Fetch special offers for services
```

### Service Tracking

**Module:** `src/features/service/routes/service-tracking.routes.js`

```
POST    /add/tracking                   → insertTracking
        Add tracking for a service

GET     /worker/tracking/services       → getWorkerTrackingServices
        [AUTH] authenticateWorkerToken
        Get tracking services for worker

GET     /user/tracking/services         → getUserTrackingServices
        [AUTH] authenticateToken
        Get tracking services for user

GET     /all/tracking/services          → getAllTrackingServices
        Get all tracking services

POST    /service/tracking/worker/item/details → getServiceTrackingWorkerItemDetails
        Get service tracking worker item details

POST    /service/tracking/user/item/details → getServiceTrackingUserItemDetails
        Get service tracking user item details

POST    /service/tracking/update/status → serviceTrackingUpdateStatus
        Update service tracking status

POST    /service/tracking/delivery/verification → serviceDeliveryVerification
        Verify delivery with OTP
```

### Service Work Management

**Module:** `src/features/service/routes/service-work.routes.js`

```
POST    /work/time/start                → startStopwatch
        Start the work timer

POST    /work/time/started              → CheckStartTime
        Check if start time exists, create if not

POST    /work/time/completed            → [Inline]
        Mark work as completed and update worker life details

POST    /work/time/completed/request    → workCompletedRequest
        Send work completion request notification

POST    /timer/value                    → getTimerValue
        Get the current timer value for a notification

POST    /work/completion/cancel         → workCompletionCancel
        Cancel work completion

POST    /worker/details                 → getWorkDetails
        Get work details for a notification

POST    /worker/confirm/completed       → serviceCompleted
        Mark service as completed

POST    /user/work/progress/details     → userWorkerInProgressDetails
        Get user-worker in-progress details

POST    /worker/work/progress/details   → WorkerWorkInProgressDetails
        Get worker work in-progress details

POST    /worker/working/status/updated  → workerStatusUpdate
        Update worker's working status and notify user
```

---

## Booking Routes

### Booking Requests

**Module:** `src/features/booking/routes/booking-request.routes.js`

```
POST    /accept/request                 → acceptRequest
        [AUTH] authenticateWorkerToken
        Accept a booking request

POST    /reject/request                 → rejectRequest
        [AUTH] authenticateWorkerToken
        Reject a booking request

POST    /user/cancellation              → cancelRequest
        Cancel a booking request from user
```

### Booking Status

**Module:** `src/features/booking/routes/booking-status.routes.js`

```
GET     /checking/status                → checkStatus
        Check if a notification exists

POST    /task/confirm/status            → checkTaskStatus
        Check task status

GET     /cancelation/navigation/status  → checkCancellationStatus
        Get cancellation navigation status

POST    /cancelation/navigation/status  → [Inline]
        Update cancellation navigation status

GET     /user/cancelled/status          → userCancellationStatus
        Get user cancellation status

GET     /worker/cancelled/status        → workerCancellationStatus
        Get worker cancellation status
```

### Booking Details

**Module:** `src/features/booking/routes/booking-details.routes.js`

```
POST    /service/booking/item/details   → getServiceBookingItemDetails
        Get booking details for a service (worker perspective)

POST    /service/booking/user/item/details → getServiceBookingUserItemDetails
        Get booking details for a service (user perspective)

POST    /service/ongoing/booking/item/details → getServiceOngoingItemDetails
        Get ongoing booking details for a service (worker perspective)

POST    /service/ongoing/worker/booking/item/details → getServiceOngoingWorkerItemDetails
        Get ongoing booking details for a service (user perspective)
```

---

## Payment Routes

**Module:** `src/features/payment/routes/payment.routes.js`

```
POST    /create-order                   → createOrder
        [AUTH] authenticateWorkerToken
        Create a payment order with Razorpay

POST    /verify-payment                 → verifyPayment
        [AUTH] authenticateWorkerToken
        Verify payment signature and update payment status

POST    /user/payed                     → processPayment
        Process payment for service completion

POST    /payment/details                → getWorkerDetails
        Get detailed payment information for a service

POST    /worker/payment/scanner/details → [Inline]
        Get payment details for scanner with service info

POST    /worker/payment/service/completed/details → getServiceCompletedDetails
        Get service completed payment details
```

---

## Tracking Routes

**Module:** `src/features/tracking/routes/tracking.routes.js`

```
POST    /route                          → getRoute
        Get route details using Ola Maps API

GET     /location/navigation            → getLocationDetails
        Get location details for navigation

GET     /user/location/navigation       → [Inline]
        Get user location details for navigation
        Fetches location details and handles navigation timeout

POST    /service/location/navigation    → getUserAndWorkerLocation
        Get user and worker location for service navigation

GET     /locations                      → getAllLocations
        Get all available locations

GET     /api/location/navigation        → getLocationDetails
        API endpoint for location navigation details
```

---

## Messaging Routes

### Chat Messages

**Module:** `src/features/messaging/routes/messaging-chat.routes.js`

```
POST    /send/message/worker            → sendMessageWorker
        Send message to worker with FCM notifications

POST    /send/message/user              → sendMessageUser
        Send message to user with FCM notifications

GET     /worker/getMessages             → workerGetMessage
        Get messages for a worker by request_id (query param)

POST    /translate                      → translateText
        Translate text using Azure Translator API
        Body: { text, fromLang, toLang }
```

### Phone Calls

**Module:** `src/features/messaging/routes/messaging-call.routes.js`

```
POST    /worker/call                    → phoneCall
        Initiate phone call from worker to user

POST    /user/call                      → UserPhoneCall
        Initiate phone call from user to worker

POST    /worker/tracking/call           → workerTrackingCall
        Initiate tracking call from worker to user

POST    /user/tracking/call             → userTrackingCall
        Initiate tracking call from user to worker

POST    /callMasking                    → callMasking
        Initiate call masking using Bonvoice AutoCall API

POST    /initiateCall                   → initiateCall
        Initiate IVR call with call masking
```

---

## Admin Routes

**Module:** `src/features/admin/routes/admin.routes.js`

```
GET     /admin/login                    → adminLogin
        Admin login endpoint

POST    /admin/administrator/service/date/details → administratorDetails
        Get administrator details (dashboard analytics)

GET     /admin/workers/pending/verification → getPendingWorkers
        Get list of pending workers who have started registration

GET     /admin/workers/pending/notStarted → getPendingWorkersNotStarted
        Get list of pending workers who have not started registration

POST    /admin/individual/worker/pending/verification → getPendingWorkerDetails
        Get details of a specific pending worker

POST    /admin/update/worker/issues    → updateIssues
        Update worker issues

POST    /admin/aprove/tracking/update/status → updateApproveStatus
        Update worker approval status

POST    /admin/check/approval/verification/status → checkApprovalVerificationStatus
        [AUTH] authenticateWorkerToken
        Check worker approval and verification status

POST    /admin/worker/approved         → workerApprove
        Approve worker and move to verified workers

POST    /admin/send/notifications      → sendNotificationsToWorkers
        Send notifications to workers
```

---

## Route Hierarchy Tree

```
API Root (/)
│
├── Authentication
│   ├── /login [POST]
│   ├── /user/login [POST]
│   ├── /worker/login [POST]
│   ├── /admin/login [GET]
│   ├── OTP Management
│   │   ├── /otp/send [POST]
│   │   ├── /otp-verify [POST]
│   │   ├── /partner/otp/send [POST]
│   │   ├── /partner/sendOtp [POST]
│   │   ├── /partner/validateOtp [GET]
│   │   ├── /worker/sendOtp [POST]
│   │   ├── /worker/validateOtp [GET]
│   │   └── /validate [GET]
│   ├── Token & Session
│   │   ├── /validate-token [POST]
│   │   ├── /pin/verification [POST]
│   │   ├── /worker/token/verification [POST]
│   │   ├── /send-sms [POST]
│   │   ├── /userLogout [POST]
│   │   └── /workerLogout [POST]
│   └── Account & Status
│       ├── /user/details/delete [POST]
│       ├── /step-status [GET]
│       ├── /registration/status [POST]
│       └── /user/login/status [GET]
│
├── User Management
│   ├── Profile
│   │   ├── /register [POST]
│   │   ├── /user/signup [POST]
│   │   ├── /user/profile [POST]
│   │   ├── /user/details/update [POST]
│   │   ├── /user/updateProfileImage [POST]
│   │   ├── /get/user [GET]
│   │   └── /user/feedback [POST]
│   ├── Bookings
│   │   ├── /user/bookings [GET]
│   │   ├── /user/ongoingBookings [GET]
│   │   ├── /user/cancellation [POST]
│   │   └── /user/work/cancel [POST]
│   ├── Location
│   │   ├── /user/location [POST]
│   │   ├── /user/store-fcm-token [POST]
│   │   └── /user/address/details [GET]
│   ├── Actions
│   │   ├── /user/action [POST]
│   │   ├── /user/action/cancel [POST]
│   │   ├── /user/track/details [GET]
│   │   ├── /user/tryping/cancel [POST]
│   │   └── /user/active/update [POST]
│   ├── Offers
│   │   ├── /user/coupons [POST]
│   │   ├── /user/referrals [GET]
│   │   ├── /user/offers [GET]
│   │   └── /user/validate-offer [POST]
│   └── Notifications
│       ├── /user/notifications [GET]
│       └── /user/store-notification [POST]
│
├── Worker Management
│   ├── Profile
│   │   ├── /add/worker [POST]
│   │   ├── /worker/profile [POST]
│   │   ├── /profile [POST]
│   │   ├── /profile/detsils [GET]
│   │   ├── /worker/profile/details [GET]
│   │   ├── /worker/updateProfileImage [POST]
│   │   ├── /profile/changes/submit [POST]
│   │   ├── /worker/verification/status [GET]
│   │   ├── /worker/ratings [GET]
│   │   ├── /worker/details/rating [POST]
│   │   └── /worker/message [POST]
│   ├── Onboarding
│   │   ├── /worker/signup [POST]
│   │   ├── /step-status [GET]
│   │   ├── /worker/skill/registration/filled [POST]
│   │   ├── /worker/categories [GET]
│   │   ├── /worker/categories/registration [GET]
│   │   ├── /worker/registration/submit [POST]
│   │   └── /worker/step-status [POST]
│   ├── Bookings
│   │   ├── /worker/bookings [GET]
│   │   ├── /worker/ongoingBookings [GET]
│   │   ├── /worker/life/details [GET]
│   │   ├── /worker/service/history [GET]
│   │   ├── /worker/current/service [GET]
│   │   └── /worker/work/cancel [POST]
│   ├── Location
│   │   ├── /worker/location [POST]
│   │   ├── /worker/location/update [POST]
│   │   ├── /worker/navigation/details [POST]
│   │   ├── /worker/track/details [GET]
│   │   ├── /worker/tryping/cancel [POST]
│   │   └── /worker/workers-nearby [POST]
│   ├── Financial
│   │   ├── /worker/account/submit [POST]
│   │   ├── /worker/account/fund_account [POST]
│   │   ├── /worker/upi/submit [POST]
│   │   ├── /worker/worker/earnings [POST]
│   │   ├── /worker/balance/ammount [POST]
│   │   ├── /worker/worker/pending/balance [POST]
│   │   ├── /worker/worker/balance/history [GET]
│   │   ├── /worker/worker/pending/cashback [POST]
│   │   ├── /worker/worker/cashback/payed [POST]
│   │   ├── /worker/worker/cashback/history [GET]
│   │   ├── /worker/workers/pending/cashback [GET]
│   │   └── /worker/pending/balance/workers [GET]
│   ├── Notifications
│   │   ├── /worker/store-fcm-token [POST]
│   │   ├── /worker/store-notification [POST]
│   │   └── /worker/notifications [GET]
│   └── Actions
│       ├── /worker/worker/action [POST]
│       ├── /worker/worker/screen/change [POST]
│       └── /worker/worker/search [GET]
│
├── Services
│   ├── Catalog
│   │   ├── /home/services [GET]
│   │   ├── /single/service [POST]
│   │   ├── /servicecategories [GET]
│   │   ├── /electrician/services [GET]
│   │   ├── /plumber/services [GET]
│   │   ├── /cleaning/services [GET]
│   │   ├── /painting/services [GET]
│   │   ├── /vehicle/services [GET]
│   │   ├── /individual/service [POST]
│   │   ├── /services [GET]
│   │   ├── /subservice/checkboxes [POST]
│   │   ├── /relatedservices [POST]
│   │   └── /special/offers [GET]
│   ├── Tracking
│   │   ├── /add/tracking [POST]
│   │   ├── /worker/tracking/services [GET]
│   │   ├── /user/tracking/services [GET]
│   │   ├── /all/tracking/services [GET]
│   │   ├── /service/tracking/worker/item/details [POST]
│   │   ├── /service/tracking/user/item/details [POST]
│   │   ├── /service/tracking/update/status [POST]
│   │   └── /service/tracking/delivery/verification [POST]
│   └── Work Management
│       ├── /work/time/start [POST]
│       ├── /work/time/started [POST]
│       ├── /work/time/completed [POST]
│       ├── /work/time/completed/request [POST]
│       ├── /timer/value [POST]
│       ├── /work/completion/cancel [POST]
│       ├── /worker/details [POST]
│       ├── /worker/confirm/completed [POST]
│       ├── /user/work/progress/details [POST]
│       ├── /worker/work/progress/details [POST]
│       └── /worker/working/status/updated [POST]
│
├── Bookings
│   ├── Requests
│   │   ├── /accept/request [POST]
│   │   ├── /reject/request [POST]
│   │   └── /user/cancellation [POST]
│   ├── Status
│   │   ├── /checking/status [GET]
│   │   ├── /task/confirm/status [POST]
│   │   ├── /cancelation/navigation/status [GET|POST]
│   │   ├── /user/cancelled/status [GET]
│   │   └── /worker/cancelled/status [GET]
│   └── Details
│       ├── /service/booking/item/details [POST]
│       ├── /service/booking/user/item/details [POST]
│       ├── /service/ongoing/booking/item/details [POST]
│       └── /service/ongoing/worker/booking/item/details [POST]
│
├── Payments
│   ├── /create-order [POST]
│   ├── /verify-payment [POST]
│   ├── /user/payed [POST]
│   ├── /payment/details [POST]
│   ├── /worker/payment/scanner/details [POST]
│   └── /worker/payment/service/completed/details [POST]
│
├── Tracking & Navigation
│   ├── /route [POST]
│   ├── /location/navigation [GET]
│   ├── /user/location/navigation [GET]
│   ├── /service/location/navigation [POST]
│   ├── /locations [GET]
│   └── /api/location/navigation [GET]
│
├── Messaging
│   ├── Chat
│   │   ├── /send/message/worker [POST]
│   │   ├── /send/message/user [POST]
│   │   ├── /worker/getMessages [GET]
│   │   └── /translate [POST]
│   └── Calls
│       ├── /worker/call [POST]
│       ├── /user/call [POST]
│       ├── /worker/tracking/call [POST]
│       ├── /user/tracking/call [POST]
│       ├── /callMasking [POST]
│       └── /initiateCall [POST]
│
└── Admin Management
    ├── /admin/login [GET]
    ├── /admin/administrator/service/date/details [POST]
    ├── /admin/workers/pending/verification [GET]
    ├── /admin/workers/pending/notStarted [GET]
    ├── /admin/individual/worker/pending/verification [POST]
    ├── /admin/update/worker/issues [POST]
    ├── /admin/aprove/tracking/update/status [POST]
    ├── /admin/check/approval/verification/status [POST]
    ├── /admin/worker/approved [POST]
    └── /admin/send/notifications [POST]
```

---

## Authentication Legend

- **[AUTH] authenticateToken** - User authentication middleware (requires valid user JWT token)
- **[AUTH] authenticateWorkerToken** - Worker authentication middleware (requires valid worker JWT token)
- **[AUTH] authenticateWorkerToken (User token)** - Uses user token for authentication
- **Public** - No authentication required

---

## Response Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request |
| 404  | Not Found |
| 500  | Internal Server Error |
| 501  | Not Implemented |

---

## Key Features

### Multi-Role Authentication
- **User Authentication** - For end-service consumers
- **Worker Authentication** - For service providers
- **Admin Authentication** - For administrative operations

### Service Categories
- Electrician Services
- Plumber Services
- Cleaning Services
- Painting Services
- Vehicle Services

### Core Functionalities
1. **User Management** - Profile, authentication, bookings, location
2. **Worker Management** - Profile, onboarding, financial, location tracking
3. **Service Catalog** - Browse services, categories, special offers
4. **Booking System** - Request, accept, reject, cancel, status tracking
5. **Payment Processing** - Razorpay integration, verification
6. **Tracking & Navigation** - Ola Maps API integration
7. **Messaging** - Chat, call masking, translation
8. **Admin Dashboard** - Worker verification, analytics, notifications

---

## Database Interaction Points

Key tables referenced across routes:
- `workers` - Worker profile information
- `workerskills` - Worker skill details
- `users` - User profile information
- `notifications` - Notification records
- `accepted` - Booking acceptance records
- `bank_accounts` - Worker bank details
- `upi_accounts` - Worker UPI details
- `workersverified` - Verified worker records

---

## Integration Services

- **Razorpay** - Payment processing and fund account creation
- **Ola Maps API** - Route and location services
- **Azure Translator** - Text translation for messaging
- **Bonvoice AutoCall** - Call masking and IVR
- **Firebase Cloud Messaging (FCM)** - Push notifications

---

**Document Version:** 1.0
**Last Generated:** 2026-01-28
**Total Endpoints:** 180+
