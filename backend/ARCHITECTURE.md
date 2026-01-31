# Backend Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Folder Structure](#folder-structure)
3. [Core Concepts](#core-concepts)
4. [Adding New Features](#adding-new-features)
5. [Import Patterns and Conventions](#import-patterns-and-conventions)
6. [File Naming Conventions](#file-naming-conventions)
7. [Feature Organization Principles](#feature-organization-principles)
8. [Best Practices](#best-practices)
9. [Directory Reference](#directory-reference)

---

## Overview

This backend uses a **feature-based modular architecture** built with Express.js and PostgreSQL. The codebase is organized into distinct features, each containing its own controllers, routes, and configurations. This structure ensures scalability, maintainability, and clear separation of concerns.

### Architecture Highlights

- **Feature-Based Organization**: Code is grouped by business features (auth, user, worker, booking, etc.)
- **Controllers & Routes Subdivision**: Each feature contains separate controllers and route files for different responsibilities
- **Centralized Index Files**: Each feature exports all its functions through a single `index.js` file
- **Modular Routes**: Routes are organized and aggregated at the core level
- **Middleware Layer**: Authentication and authorization middleware is centralized
- **Database Abstraction**: Database queries are organized in a dedicated queries directory

---

## Folder Structure

### Top-Level Directory Layout

```
backend/
├── src/                           # Source code directory
│   ├── features/                  # Feature modules (core of app)
│   ├── config/                    # Configuration files
│   ├── database/                  # Database setup and queries
│   ├── middlewares/               # Middleware functions
│   ├── routes/                    # Route aggregation
│   ├── services/                  # Business logic services (optional)
│   └── utils/                     # Utility functions
├── app.js                         # Express app entry point
├── package.json                   # Dependencies
├── package-lock.json              # Dependency lock file
└── ARCHITECTURE.md                # This file
```

### src/features/ - Feature Modules Structure

Each feature follows a consistent structure:

```
features/
├── auth/                          # Authentication feature
│   ├── controllers/               # Auth controller files
│   │   ├── auth-login.controller.js
│   │   ├── auth-otp.controller.js
│   │   ├── auth-session.controller.js
│   │   ├── auth-status.controller.js
│   │   ├── auth-cron.controller.js
│   │   └── index.js               # Exports all controllers
│   ├── routes/                    # Auth route definitions
│   │   └── auth.routes.js
│   └── index.js                   # Feature entry point
│
├── booking/                       # Booking feature
│   ├── controllers/
│   │   ├── booking-request.controller.js
│   │   ├── booking-status.controller.js
│   │   ├── booking-location.controller.js
│   │   ├── booking-details.controller.js
│   │   └── index.js
│   ├── routes/
│   │   ├── booking-request.routes.js
│   │   ├── booking-status.routes.js
│   │   └── booking-details.routes.js
│   └── index.js
│
├── user/                          # User feature
│   ├── controllers/
│   │   ├── user-profile.controller.js
│   │   ├── user-booking.controller.js
│   │   ├── user-location.controller.js
│   │   ├── user-action.controller.js
│   │   ├── user-offer.controller.js
│   │   ├── user-notification.controller.js
│   │   └── index.js
│   ├── routes/
│   │   ├── user-profile.routes.js
│   │   ├── user-booking.routes.js
│   │   ├── user-location.routes.js
│   │   ├── user-action.routes.js
│   │   ├── user-offer.routes.js
│   │   └── user-notification.routes.js
│   └── index.js
│
├── worker/                        # Worker feature
│   ├── controllers/
│   │   ├── worker-profile.controller.js
│   │   ├── worker-onboarding.controller.js
│   │   ├── worker-booking.controller.js
│   │   ├── worker-location.controller.js
│   │   ├── worker-financial.controller.js
│   │   ├── worker-notification.controller.js
│   │   ├── worker-action.controller.js
│   │   ├── worker-communication.controller.js
│   │   ├── worker-verification.controller.js
│   │   └── index.js
│   ├── routes/
│   │   ├── worker-profile.routes.js
│   │   ├── worker-onboarding.routes.js
│   │   ├── worker-booking.routes.js
│   │   ├── worker-location.routes.js
│   │   ├── worker-financial.routes.js
│   │   ├── worker-notification.routes.js
│   │   ├── worker-action.routes.js
│   │   └── worker-communication.routes.js
│   └── index.js
│
├── payment/                       # Payment feature
│   ├── controllers/
│   │   ├── payment.controller.js
│   │   └── index.js
│   ├── routes/
│   │   └── payment.routes.js
│   └── index.js
│
├── service/                       # Service catalog feature
│   ├── controllers/
│   │   ├── service.controller.js
│   │   ├── service-tracking.controller.js
│   │   ├── service-timer.controller.js
│   │   ├── service-work.controller.js
│   │   ├── service.helpers.js
│   │   └── index.js
│   ├── routes/
│   │   ├── service-catalog.routes.js
│   │   ├── service-tracking.routes.js
│   │   └── service-work.routes.js
│   └── index.js
│
├── tracking/                      # Location tracking feature
│   ├── controllers/
│   │   ├── tracking-route.controller.js
│   │   ├── tracking-service.controller.js
│   │   ├── tracking-location.controller.js
│   │   └── index.js
│   ├── routes/
│   │   └── tracking.routes.js
│   └── index.js
│
├── messaging/                     # Messaging & call feature
│   ├── controllers/
│   │   ├── messaging-chat.controller.js
│   │   ├── messaging-call.controller.js
│   │   ├── messaging-translation.controller.js
│   │   └── index.js
│   ├── routes/
│   │   ├── messaging-chat.routes.js
│   │   └── messaging-call.routes.js
│   └── index.js
│
└── admin/                         # Admin feature
    ├── controllers/
    │   ├── admin-auth.controller.js
    │   ├── admin-dashboard.controller.js
    │   ├── admin-worker-approval.controller.js
    │   └── index.js
    ├── routes/
    │   └── admin.routes.js
    └── index.js
```

### src/config/ - Configuration

```
config/
├── firebase.config.js             # Firebase/FCM configuration
└── index.js                       # Exports all configs
```

### src/database/ - Database Layer

```
database/
├── connection.js                  # PostgreSQL connection setup
├── index.js                       # Exports database connection
├── migrations/                    # Migration files (.sql)
│   └── .gitkeep
└── queries/                       # Database query files
    ├── index.js                   # Exports all queries
    ├── user.queries.js
    ├── worker.queries.js
    ├── booking.queries.js
    └── payment.queries.js
```

### src/middlewares/ - Middleware Functions

```
middlewares/
├── index.js                       # Exports all middleware
├── auth.middleware.js             # User authentication
├── worker-auth.middleware.js      # Worker authentication
└── admin-auth.middleware.js       # Admin authentication
```

### src/utils/ - Utility Functions

```
utils/
├── index.js                       # Exports all utilities
├── token.util.js                  # JWT token generation
├── encryption.util.js             # Encryption/decryption helpers
└── generateToken.js               # Legacy token generation
```

### src/routes/ - Route Aggregation

```
routes/
└── index.js                       # Central route aggregator
```

---

## Core Concepts

### 1. Feature Module

A feature module is a self-contained unit representing a business domain (e.g., auth, user, worker). Each feature:
- Has its own controllers, routes, and dependencies
- Exports a clean interface through an index.js
- Can be developed independently
- Clearly defines its responsibilities

### 2. Controllers

Controllers contain the business logic for handling HTTP requests. They:
- Accept request data
- Call database queries or services
- Process responses
- Return appropriate HTTP responses

**Pattern**: Subdivide large controllers into smaller, focused controllers grouped by functionality.

Example: `auth-login.controller.js`, `auth-otp.controller.js`, `auth-session.controller.js`

### 3. Routes

Routes define API endpoints and map them to controller functions. They:
- Define HTTP methods (GET, POST, PUT, DELETE)
- Define URL paths
- Apply middleware
- Call appropriate controller functions

**Pattern**: Create separate route files for related functionality areas.

### 4. Index Files

Each feature and directory with multiple files exports a centralized `index.js`:
- Imports all sub-modules
- Uses spread operator to re-export
- Provides a single entry point
- Improves code clarity

### 5. Middleware

Middleware functions intercept requests before reaching controllers:
- Authentication middleware validates tokens
- Authorization middleware checks permissions
- Error handling middleware catches exceptions

---

## Adding New Features

### Step 1: Create Feature Directory

Create a new directory under `src/features/`:

```bash
mkdir -p src/features/yourfeature/{controllers,routes}
```

### Step 2: Create Controllers

Create subdivided controller files based on functionality:

```javascript
// src/features/yourfeature/controllers/yourfeature-operation1.controller.js

const operation1 = async (req, res) => {
  try {
    // Your business logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const operation2 = async (req, res) => {
  try {
    // Your business logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  operation1,
  operation2,
};
```

### Step 3: Create Feature Index File

```javascript
// src/features/yourfeature/controllers/index.js

/**
 * YourFeature Controllers
 *
 * Aggregates all controller functions from subdivided controller files.
 */

const operation1Controller = require("./yourfeature-operation1.controller.js");
const operation2Controller = require("./yourfeature-operation2.controller.js");

module.exports = {
  // Operation 1 functions
  ...operation1Controller,

  // Operation 2 functions
  ...operation2Controller,
};
```

### Step 4: Create Route Files

Create separate route files for different areas:

```javascript
// src/features/yourfeature/routes/yourfeature-operation1.routes.js

const express = require("express");
const router = express.Router();

// Import controllers
const { operation1, operation2 } = require("../controllers");

// Import middleware
const { authenticateToken } = require("../../middlewares");

// Routes
router.post("/yourfeature/operation1", authenticateToken, operation1);
router.get("/yourfeature/operation2/:id", authenticateToken, operation2);

module.exports = router;
```

### Step 5: Create Feature Entry Point

```javascript
// src/features/yourfeature/index.js

// Import all controllers
module.exports = require("./controllers");
```

### Step 6: Register Routes in Central Router

```javascript
// src/routes/index.js

// At the top with other feature imports
const yourFeatureRoutes = require("../features/yourfeature/routes/yourfeature-operation1.routes");

// In the route mounting section
router.use("/", yourFeatureRoutes);

module.exports = router;
```

### Step 7: (Optional) Create Database Queries

If your feature needs database access:

```javascript
// src/database/queries/yourfeature.queries.js

const client = require("../connection");

const getYourFeatureData = async (id) => {
  const query = 'SELECT * FROM your_table WHERE id = $1';
  const result = await client.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  getYourFeatureData,
};
```

Update `src/database/queries/index.js` to export the new queries:

```javascript
module.exports = {
  ...require("./user.queries.js"),
  ...require("./worker.queries.js"),
  ...require("./yourfeature.queries.js"), // Add this
};
```

---

## Import Patterns and Conventions

### Pattern 1: Import from Feature Entry Point

**Recommended for most use cases:**

```javascript
// Import all functions from a feature
const { login, sendOtp, userLogout } = require("../features/auth");

// Or import specific functions needed
const auth = require("../features/auth");
auth.login(...);
```

**Benefits:**
- Single import statement
- Clean and readable
- Easier to discover available functions
- Automatic IDE autocomplete

### Pattern 2: Import from Sub-Controller

**Use when you want to be explicit about which sub-controller:**

```javascript
// Import from specific sub-controller
const { login, workerAuthentication } = require("../features/auth/controllers/auth-login.controller.js");
```

**When to use:**
- When you need only specific functions
- When organizing large route files
- For better code documentation

### Pattern 3: Import Middleware

```javascript
// From central middleware export
const { authenticateToken, authenticateWorkerToken } = require("../../middlewares");

// Or import specific middleware
const { authenticateToken } = require("../../middlewares/auth.middleware.js");
```

### Pattern 4: Import Database Queries

```javascript
// From centralized database queries
const { getUser, getWorker } = require("../../database/queries");

// Or from specific query file
const { getUser } = require("../../database/queries/user.queries.js");
```

### Pattern 5: Import Utilities

```javascript
// From centralized utilities
const { generateToken, encryptData } = require("../../utils");

// Or from specific utility file
const { generateToken } = require("../../utils/token.util.js");
```

---

## File Naming Conventions

### Controllers

**Format**: `{feature}-{function-area}.controller.js`

**Examples:**
- `auth-login.controller.js` - Login-related functions
- `auth-otp.controller.js` - OTP management functions
- `user-profile.controller.js` - User profile operations
- `worker-financial.controller.js` - Worker financial operations
- `booking-request.controller.js` - Booking request handling

**Rules:**
- Use lowercase with hyphens (kebab-case)
- Be specific about the functional area
- One controller per focused responsibility
- Name should clearly indicate what it does

### Routes

**Format**: `{feature}-{function-area}.routes.js`

**Examples:**
- `auth.routes.js` - Authentication routes
- `user-profile.routes.js` - User profile routes
- `worker-financial.routes.js` - Worker financial routes

**Rules:**
- Match controller naming pattern
- Group related routes together
- Keep route files focused on one area

### Utilities

**Format**: `{purpose}.util.js`

**Examples:**
- `token.util.js` - Token generation and validation
- `encryption.util.js` - Encryption/decryption functions
- `email.util.js` - Email sending utilities

**Rules:**
- Clear purpose in the name
- Use lowercase with hyphens

### Middleware

**Format**: `{purpose}.middleware.js`

**Examples:**
- `auth.middleware.js` - User authentication
- `worker-auth.middleware.js` - Worker authentication
- `admin-auth.middleware.js` - Admin authentication

**Rules:**
- Indicate what it does
- Separate middleware by concern

### Database Queries

**Format**: `{entity}.queries.js`

**Examples:**
- `user.queries.js` - All user-related queries
- `worker.queries.js` - All worker-related queries
- `booking.queries.js` - All booking-related queries

**Rules:**
- Name after the main entity
- Group related queries together
- Use consistent function naming

---

## Feature Organization Principles

### Principle 1: Single Responsibility

Each file and controller should have a single, well-defined responsibility.

**Example:**
```
✓ auth-login.controller.js - Only handles login
✓ auth-otp.controller.js - Only handles OTP
✗ auth-all.controller.js - Does too many things
```

### Principle 2: Feature Cohesion

Group related functionality within the same feature.

**Example:**
```
✓ Feature: auth
  - Login, OTP, Sessions, Status

✓ Feature: user
  - Profile, Bookings, Notifications, Location

✗ Mixing auth and user in same controller
```

### Principle 3: Minimal Cross-Feature Coupling

Features should be as independent as possible. Dependencies should be clear.

**Example:**
```
✓ User feature imports from auth (authentication)
✓ Worker feature imports from booking (work assignments)
✗ Circular dependencies between features
```

### Principle 4: Consistent Structure

All features follow the same structural pattern.

**Pattern:**
```
feature/
├── controllers/
│   ├── feature-area1.controller.js
│   ├── feature-area2.controller.js
│   └── index.js
├── routes/
│   ├── feature-area1.routes.js
│   └── feature-area2.routes.js
└── index.js
```

### Principle 5: Centralized Exports

Each directory level exports all its contents through index.js.

**Hierarchy:**
```
Controllers folder → exports via controllers/index.js
Feature folder → exports via feature/index.js (which re-exports controllers)
Routes folder → each route file is exported in central router
```

### Principle 6: Clear Naming

Names should clearly indicate purpose and scope.

**Examples:**
```
✓ auth-login.controller.js
✓ user-profile.routes.js
✓ worker-financial.controller.js
✗ controller.js
✗ routes.js
✗ auth-misc.controller.js
```

### Principle 7: Middleware Separation

Authentication and authorization logic is separate from business logic.

**Pattern:**
```
Routes: Import middleware and controllers separately
Middleware: Pure authentication/authorization logic
Controllers: Pure business logic
```

### Principle 8: Database Query Abstraction

Database queries are in separate files, not in controllers.

**Pattern:**
```
Controller: Calls query functions
Query file: Contains SQL and database logic
```

**Example:**
```javascript
// In controller
const user = await getUser(userId);

// In database/queries/user.queries.js
const getUser = async (userId) => {
  const query = 'SELECT * FROM "user" WHERE user_id = $1';
  const result = await client.query(query, [userId]);
  return result.rows[0];
};
```

---

## Best Practices

### 1. Error Handling

Always wrap controller logic in try-catch blocks:

```javascript
const myController = async (req, res) => {
  try {
    // Your logic
    res.json({ success: true });
  } catch (error) {
    console.error("Error in myController:", error);
    res.status(500).json({ error: error.message });
  }
};
```

### 2. Validation

Validate input before processing:

```javascript
const createUser = async (req, res) => {
  const { name, email, phone } = req.body;

  // Validate required fields
  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Process valid data
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 3. Middleware Application

Apply middleware at the route level for fine-grained control:

```javascript
// Only apply middleware to specific routes
router.post(
  "/protected-route",
  authenticateToken,
  myController
);

// Public route - no middleware
router.get("/public-route", myController);
```

### 4. Consistent Response Format

Use consistent response structure:

```javascript
// Success response
res.json({
  success: true,
  data: { /* your data */ },
  message: "Operation successful"
});

// Error response
res.status(400).json({
  success: false,
  error: "Error message",
  code: "ERROR_CODE"
});
```

### 5. Code Comments

Add comments for complex logic:

```javascript
// Clear controller-level comment
/**
 * Processes user login
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const login = async (req, res) => {
  // Complex logic explanation
};
```

### 6. Avoid Deep Nesting

Keep code readable with early returns:

```javascript
// Bad: Deep nesting
const process = async (req, res) => {
  if (condition1) {
    if (condition2) {
      if (condition3) {
        // Process
      }
    }
  }
};

// Good: Early returns
const process = async (req, res) => {
  if (!condition1) return res.status(400).json({ error: "..." });
  if (!condition2) return res.status(400).json({ error: "..." });
  if (!condition3) return res.status(400).json({ error: "..." });

  // Process
};
```

### 7. DRY Principle

Don't repeat code - extract to helpers:

```javascript
// Create a helper for common logic
const validateUserPhone = (phone) => {
  if (!phone || phone.length < 10) {
    throw new Error("Invalid phone number");
  }
};

// Use in multiple controllers
const controller1 = async (req, res) => {
  validateUserPhone(req.body.phone);
  // ...
};

const controller2 = async (req, res) => {
  validateUserPhone(req.body.phone);
  // ...
};
```

### 8. Async/Await Usage

Always use async/await, avoid callback hell:

```javascript
// Good
const getUser = async (userId) => {
  const user = await db.query("SELECT * FROM user WHERE id = $1", [userId]);
  return user.rows[0];
};

// Avoid
const getUser = (userId, callback) => {
  db.query("SELECT * FROM user WHERE id = $1", [userId], (err, user) => {
    callback(err, user.rows[0]);
  });
};
```

---

## Directory Reference

### Quick Navigation

**Need to add authentication logic?**
→ `src/features/auth/`

**Need to add user functionality?**
→ `src/features/user/`

**Need to add worker functionality?**
→ `src/features/worker/`

**Need to add booking logic?**
→ `src/features/booking/`

**Need to add payment processing?**
→ `src/features/payment/`

**Need to add service catalog features?**
→ `src/features/service/`

**Need to add tracking features?**
→ `src/features/tracking/`

**Need to add messaging/calls?**
→ `src/features/messaging/`

**Need to add admin features?**
→ `src/features/admin/`

**Need to add database queries?**
→ `src/database/queries/`

**Need authentication middleware?**
→ `src/middlewares/`

**Need utility functions?**
→ `src/utils/`

**Need to configure external services?**
→ `src/config/`

---

## Example: Complete Feature Addition

Here's a complete example of adding a new "notification" feature:

### 1. Create directories

```bash
mkdir -p src/features/notifications/{controllers,routes}
```

### 2. Create controller

```javascript
// src/features/notifications/controllers/notification-email.controller.js

const sendEmailNotification = async (req, res) => {
  try {
    const { userId, subject, body } = req.body;

    if (!userId || !subject || !body) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Send email logic
    res.json({ success: true, message: "Email sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  sendEmailNotification,
};
```

### 3. Create controllers index

```javascript
// src/features/notifications/controllers/index.js

const emailController = require("./notification-email.controller.js");

module.exports = {
  ...emailController,
};
```

### 4. Create routes

```javascript
// src/features/notifications/routes/notification-email.routes.js

const express = require("express");
const router = express.Router();
const { sendEmailNotification } = require("../controllers");
const { authenticateToken } = require("../../middlewares");

router.post("/notifications/email", authenticateToken, sendEmailNotification);

module.exports = router;
```

### 5. Create feature index

```javascript
// src/features/notifications/index.js

module.exports = require("./controllers");
```

### 6. Register in central router

```javascript
// src/routes/index.js

const notificationRoutes = require("../features/notifications/routes/notification-email.routes.js");

// ... existing code ...

router.use("/", notificationRoutes);

module.exports = router;
```

---

## Summary

This architecture provides:

✓ **Scalability** - Add features without affecting existing code
✓ **Maintainability** - Clear structure makes code easy to understand
✓ **Reusability** - Shared utilities and middleware across features
✓ **Testability** - Small, focused modules are easier to test
✓ **Collaboration** - Multiple developers can work on different features independently
✓ **Performance** - Modular code loads efficiently

Follow these principles and patterns to keep the codebase clean and maintainable as it grows.

---

**Last Updated**: 2026-01-28
**Architecture Version**: 2.0 - Feature-based Modular Architecture
**Total Features**: 9
**Total Controllers**: 45+
