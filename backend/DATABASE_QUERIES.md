# Database Queries Layer Documentation

## Overview

The queries layer is a centralized database abstraction system that manages all SQL queries across the ClickSolver backend application. It provides a single source of truth for database operations, improving maintainability, security, and code organization.

### Key Features

- **Centralized Query Management**: All SQL queries are stored in dedicated query modules
- **Parameterized Queries**: All queries use parameter placeholders to prevent SQL injection
- **Module Organization**: Queries are organized by domain (user, worker, booking, payment, etc.)
- **Flexible Import Options**: Support for both named imports and grouped access patterns
- **Soft Deletes**: Consistent soft delete implementation across all entities
- **Timestamp Management**: Automatic timestamp handling with CURRENT_TIMESTAMP

---

## Architecture

### Directory Structure

```
src/database/
├── queries/
│   ├── index.js                 # Central export point
│   ├── auth.queries.js          # Authentication & onboarding queries
│   ├── user.queries.js          # User-related queries
│   ├── worker.queries.js        # Worker profile queries
│   ├── booking.queries.js       # Booking operation queries
│   ├── payment.queries.js       # Payment & transaction queries
│   ├── service.queries.js       # Service listing queries
│   ├── tracking.queries.js      # Tracking & location queries
│   ├── messaging.queries.js     # Messaging & communication queries
│   └── admin.queries.js         # Administrative queries
├── connection.js                # Database connection configuration
└── index.js                     # Database module exports
```

### Query Module Pattern

Each query module follows a consistent structure:

```javascript
/**
 * [Module] Database Queries
 * Describes what queries this module contains
 */

// Group-related queries with section headers
const [queryName]Query = `
  SQL_STATEMENT_HERE
`;

module.exports = {
  [queryName]Query,
  // ... other exports
};
```

---

## How to Import and Use Queries

### Import Methods

#### 1. Named Exports (Individual Query Access)

Import specific queries from a module:

```javascript
const {
  getUserByIdQuery,
  createUserQuery,
  updateUserQuery,
} = require('../database/queries/user.queries');

const client = require('../database/connection');

// Use the query
const result = await client.query(getUserByIdQuery, [userId]);
```

#### 2. Grouped Imports (Organized Access)

Import all queries from a module:

```javascript
const { userQueries } = require('../database/queries');

const result = await client.query(
  userQueries.getUserByIdQuery,
  [userId]
);
```

#### 3. Centralized Queries Object

Access queries from the main queries object:

```javascript
const { queries } = require('../database/queries');

const result = await client.query(
  queries.user.getUserByIdQuery,
  [userId]
);
```

#### 4. Backward Compatible Spread Exports

All individual queries are spread at the root level:

```javascript
const { userQueries, workerQueries, bookingQueries } = require('../database/queries');

// All queries are directly available
const userResult = await client.query(userQueries.getUserByIdQuery, [id]);
const workerResult = await client.query(
  workerQueries.getWorkerByIdQuery,
  [id]
);
```

---

## Query Module Examples

### User Queries Module

**File**: `/src/database/queries/user.queries.js`

```javascript
const getUserByIdQuery = `
  SELECT id, name, email, phone, avatar_url, status, created_at, updated_at
  FROM users
  WHERE id = $1 AND deleted_at IS NULL;
`;

const createUserQuery = `
  INSERT INTO users (name, email, phone, avatar_url, status, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, name, email, phone, avatar_url, status, created_at, updated_at;
`;

const updateUserQuery = `
  UPDATE users
  SET name = COALESCE($2, name),
      email = COALESCE($3, email),
      phone = COALESCE($4, phone),
      avatar_url = COALESCE($5, avatar_url),
      status = COALESCE($6, status),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, name, email, phone, avatar_url, status, created_at, updated_at;
`;

const getAllUsersQuery = `
  SELECT id, name, email, phone, avatar_url, status, created_at, updated_at
  FROM users
  WHERE deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2;
`;

const deleteUserQuery = `
  UPDATE users
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id;
`;
```

**Usage Example**:

```javascript
const { userQueries } = require('../database/queries');
const client = require('../database/connection');

// Get a user by ID
async function getUser(userId) {
  try {
    const result = await client.query(
      userQueries.getUserByIdQuery,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Create a new user
async function createUser(name, email, phone, avatarUrl, status) {
  try {
    const result = await client.query(
      userQueries.createUserQuery,
      [name, email, phone, avatarUrl, status]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Update a user (partial update with COALESCE)
async function updateUser(userId, updates) {
  try {
    const result = await client.query(
      userQueries.updateUserQuery,
      [
        userId,
        updates.name || null,
        updates.email || null,
        updates.phone || null,
        updates.avatar_url || null,
        updates.status || null,
      ]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Get paginated users
async function getPaginatedUsers(limit, offset) {
  try {
    const result = await client.query(
      userQueries.getAllUsersQuery,
      [limit, offset]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// Soft delete a user
async function deleteUser(userId) {
  try {
    const result = await client.query(
      userQueries.deleteUserQuery,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}
```

---

### Authentication Queries Module

**File**: `/src/database/queries/auth.queries.js`

This module contains comprehensive authentication-related queries organized into sections:

#### OTP Management

```javascript
const STORE_OTP = `
  INSERT INTO otps (phone_number, otp_code, expires_at, created_at, attempts)
  VALUES (?, ?, ?, ?, 0)
  ON DUPLICATE KEY UPDATE
    otp_code = VALUES(otp_code),
    expires_at = VALUES(expires_at),
    created_at = VALUES(created_at),
    attempts = 0
`;

const VERIFY_OTP = `
  SELECT id, phone_number, otp_code, expires_at, attempts, created_at
  FROM otps
  WHERE phone_number = ? AND otp_code = ? AND expires_at > NOW()
  LIMIT 1
`;

const CHECK_OTP_VALIDITY = `
  SELECT id, expires_at, attempts
  FROM otps
  WHERE phone_number = ? AND expires_at > NOW()
  LIMIT 1
`;

const INCREMENT_OTP_ATTEMPTS = `
  UPDATE otps
  SET attempts = attempts + 1
  WHERE phone_number = ? AND expires_at > NOW()
`;

const DELETE_OTP = `
  DELETE FROM otps
  WHERE phone_number = ?
`;
```

**Usage Example**:

```javascript
const { authQueries } = require('../database/queries');
const client = require('../database/connection');

// Store OTP
async function storeOTP(phoneNumber, otpCode, expiresAt) {
  try {
    await client.query(authQueries.STORE_OTP, [
      phoneNumber,
      otpCode,
      expiresAt,
      new Date(),
    ]);
  } catch (error) {
    console.error('Error storing OTP:', error);
    throw error;
  }
}

// Verify OTP
async function verifyOTP(phoneNumber, otpCode) {
  try {
    const result = await client.query(authQueries.VERIFY_OTP, [
      phoneNumber,
      otpCode,
    ]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
}

// Delete OTP after verification
async function deleteOTP(phoneNumber) {
  try {
    await client.query(authQueries.DELETE_OTP, [phoneNumber]);
  } catch (error) {
    console.error('Error deleting OTP:', error);
    throw error;
  }
}
```

#### Session Management

```javascript
const CREATE_SESSION = `
  INSERT INTO sessions (user_id, user_type, token, ip_address, user_agent, expires_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

const GET_SESSION_BY_TOKEN = `
  SELECT id, user_id, user_type, ip_address, user_agent, expires_at, created_at, last_activity
  FROM sessions
  WHERE token = ? AND expires_at > NOW() AND is_active = TRUE
  LIMIT 1
`;

const INVALIDATE_SESSION = `
  UPDATE sessions
  SET is_active = FALSE, invalidated_at = NOW()
  WHERE token = ? AND is_active = TRUE
`;

const INVALIDATE_ALL_USER_SESSIONS = `
  UPDATE sessions
  SET is_active = FALSE, invalidated_at = NOW()
  WHERE user_id = ? AND user_type = ? AND is_active = TRUE
`;
```

**Usage Example**:

```javascript
// Create a session
async function createSession(userId, userType, token, ipAddress, userAgent, expiresAt) {
  try {
    await client.query(authQueries.CREATE_SESSION, [
      userId,
      userType,
      token,
      ipAddress,
      userAgent,
      expiresAt,
      new Date(),
    ]);
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

// Get session by token
async function getSessionByToken(token) {
  try {
    const result = await client.query(authQueries.GET_SESSION_BY_TOKEN, [token]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw error;
  }
}

// Logout (invalidate single session)
async function invalidateSession(token) {
  try {
    await client.query(authQueries.INVALIDATE_SESSION, [token]);
  } catch (error) {
    console.error('Error invalidating session:', error);
    throw error;
  }
}

// Logout from all devices
async function logoutAllSessions(userId, userType) {
  try {
    await client.query(authQueries.INVALIDATE_ALL_USER_SESSIONS, [userId, userType]);
  } catch (error) {
    console.error('Error invalidating all sessions:', error);
    throw error;
  }
}
```

---

### Worker Queries Module

**File**: `/src/database/queries/worker.queries.js`

```javascript
const getWorkerByIdQuery = `
  SELECT id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
         location, latitude, longitude, is_available, verified, created_at, updated_at
  FROM workers
  WHERE id = $1 AND deleted_at IS NULL;
`;

const createWorkerQuery = `
  INSERT INTO workers (user_id, specialization, bio, hourly_rate, location,
                       latitude, longitude, is_available, verified, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
            location, latitude, longitude, is_available, verified, created_at, updated_at;
`;

const getAvailableWorkersBySpecializationQuery = `
  SELECT id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
         location, latitude, longitude, is_available, verified, created_at, updated_at
  FROM workers
  WHERE specialization = $1 AND is_available = true AND deleted_at IS NULL
  ORDER BY rating DESC, total_jobs DESC
  LIMIT $2 OFFSET $3;
`;

const getWorkersByLocationQuery = `
  SELECT id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
         location, latitude, longitude, is_available, verified, created_at, updated_at
  FROM workers
  WHERE location = $1 AND is_available = true AND deleted_at IS NULL
  ORDER BY rating DESC, total_jobs DESC
  LIMIT $2 OFFSET $3;
`;
```

**Usage Example**:

```javascript
const { workerQueries } = require('../database/queries');
const client = require('../database/connection');

// Get worker details
async function getWorker(workerId) {
  try {
    const result = await client.query(
      workerQueries.getWorkerByIdQuery,
      [workerId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching worker:', error);
    throw error;
  }
}

// Search available workers by specialization
async function searchWorkersBySpecialization(specialization, limit, offset) {
  try {
    const result = await client.query(
      workerQueries.getAvailableWorkersBySpecializationQuery,
      [specialization, limit, offset]
    );
    return result.rows;
  } catch (error) {
    console.error('Error searching workers:', error);
    throw error;
  }
}

// Search workers by location
async function searchWorkersByLocation(location, limit, offset) {
  try {
    const result = await client.query(
      workerQueries.getWorkersByLocationQuery,
      [location, limit, offset]
    );
    return result.rows;
  } catch (error) {
    console.error('Error searching workers by location:', error);
    throw error;
  }
}

// Create new worker profile
async function createWorker(userId, specialization, bio, hourlyRate, location, lat, lng) {
  try {
    const result = await client.query(
      workerQueries.createWorkerQuery,
      [userId, specialization, bio, hourlyRate, location, lat, lng, true, false]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating worker:', error);
    throw error;
  }
}
```

---

### Booking Queries Module

**File**: `/src/database/queries/booking.queries.js`

```javascript
const getBookingByIdQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE id = $1 AND deleted_at IS NULL;
`;

const createBookingQuery = `
  INSERT INTO bookings (user_id, worker_id, service_type, description, location,
                        latitude, longitude, scheduled_date, scheduled_time, status,
                        estimated_amount, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, user_id, worker_id, service_type, description, location,
            latitude, longitude, scheduled_date, scheduled_time, status,
            estimated_amount, actual_amount, created_at, updated_at;
`;

const updateBookingStatusQuery = `
  UPDATE bookings
  SET status = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, user_id, worker_id, status, updated_at;
`;

const getBookingsByUserQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE user_id = $1 AND deleted_at IS NULL
  ORDER BY scheduled_date DESC, scheduled_time DESC
  LIMIT $2 OFFSET $3;
`;

const getBookingsByWorkerQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE worker_id = $1 AND deleted_at IS NULL
  ORDER BY scheduled_date DESC, scheduled_time DESC
  LIMIT $2 OFFSET $3;
`;
```

**Usage Example**:

```javascript
const { bookingQueries } = require('../database/queries');
const client = require('../database/connection');

// Create a new booking
async function createBooking(
  userId,
  workerId,
  serviceType,
  description,
  location,
  latitude,
  longitude,
  scheduledDate,
  scheduledTime,
  estimatedAmount
) {
  try {
    const result = await client.query(
      bookingQueries.createBookingQuery,
      [
        userId,
        workerId,
        serviceType,
        description,
        location,
        latitude,
        longitude,
        scheduledDate,
        scheduledTime,
        'pending', // status
        estimatedAmount,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

// Get booking details
async function getBooking(bookingId) {
  try {
    const result = await client.query(
      bookingQueries.getBookingByIdQuery,
      [bookingId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
}

// Update booking status
async function updateBookingStatus(bookingId, newStatus) {
  try {
    const result = await client.query(
      bookingQueries.updateBookingStatusQuery,
      [bookingId, newStatus]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
}

// Get user's bookings
async function getUserBookings(userId, limit, offset) {
  try {
    const result = await client.query(
      bookingQueries.getBookingsByUserQuery,
      [userId, limit, offset]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
}

// Get worker's bookings
async function getWorkerBookings(workerId, limit, offset) {
  try {
    const result = await client.query(
      bookingQueries.getBookingsByWorkerQuery,
      [workerId, limit, offset]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching worker bookings:', error);
    throw error;
  }
}
```

---

## Best Practices for Using Parameterized Queries

### 1. Always Use Parameters for Dynamic Values

**GOOD - Prevents SQL Injection**:
```javascript
const query = `SELECT * FROM users WHERE id = $1`;
const result = await client.query(query, [userId]);
```

**BAD - Vulnerable to SQL Injection**:
```javascript
// DO NOT DO THIS!
const query = `SELECT * FROM users WHERE id = ${userId}`;
const result = await client.query(query);
```

### 2. Parameter Ordering

PostgreSQL uses `$1, $2, $3...` for positional parameters:

```javascript
const query = `
  UPDATE users
  SET name = $1, email = $2, phone = $3
  WHERE id = $4
`;

// Parameters array must be in the exact order:
const result = await client.query(query, [
  name,      // $1
  email,     // $2
  phone,     // $3
  userId     // $4
]);
```

### 3. Handling NULL Values

Use `COALESCE` for optional updates:

```javascript
const query = `
  UPDATE users
  SET name = COALESCE($2, name),
      email = COALESCE($3, email),
      phone = COALESCE($4, phone)
  WHERE id = $1
`;

const result = await client.query(query, [
  userId,
  updates.name || null,      // Update only if provided
  updates.email || null,
  updates.phone || null
]);
```

### 4. Pagination with LIMIT and OFFSET

```javascript
const query = `
  SELECT * FROM users
  WHERE deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2
`;

const limit = 10;
const offset = (page - 1) * limit;

const result = await client.query(query, [limit, offset]);
```

### 5. Soft Deletes with IS NULL Checks

Always check `deleted_at IS NULL` for active records:

```javascript
const query = `
  SELECT id, name, email FROM users
  WHERE id = $1 AND deleted_at IS NULL
`;

const result = await client.query(query, [userId]);
```

### 6. Error Handling with Try-Catch

```javascript
async function getUserData(userId) {
  try {
    const result = await client.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );
    return result.rows[0];
  } catch (error) {
    // Log the error
    console.error('Database error:', error.message);
    // Re-throw or handle appropriately
    throw new Error('Failed to fetch user data');
  }
}
```

### 7. Transaction Support

For operations requiring multiple queries:

```javascript
async function transferUserBookings(fromUserId, toUserId) {
  const connection = await client.connect();
  try {
    await connection.query('BEGIN');

    // Update all bookings
    await connection.query(
      'UPDATE bookings SET user_id = $1 WHERE user_id = $2',
      [toUserId, fromUserId]
    );

    // Delete from original user
    await connection.query(
      'DELETE FROM user_bookmarks WHERE user_id = $1',
      [fromUserId]
    );

    await connection.query('COMMIT');
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}
```

---

## How to Add New Queries

### Step 1: Choose or Create a Query Module

Determine which existing module your query belongs to, or create a new one:

```
- Authentication-related? → auth.queries.js
- User-related? → user.queries.js
- Worker-related? → worker.queries.js
- Booking-related? → booking.queries.js
- Payment-related? → payment.queries.js
- Service-related? → service.queries.js
- Tracking-related? → tracking.queries.js
- Messaging-related? → messaging.queries.js
- Admin-related? → admin.queries.js
```

### Step 2: Define the Query

Add your query constant to the appropriate module with documentation:

```javascript
/**
 * Get all active workers with a minimum rating
 * Filters workers by minimum rating threshold
 * Ordered by rating and job count
 */
const GET_HIGHLY_RATED_WORKERS = `
  SELECT id, user_id, specialization, rating, total_jobs, hourly_rate
  FROM workers
  WHERE is_available = true AND deleted_at IS NULL AND rating >= $1
  ORDER BY rating DESC, total_jobs DESC
  LIMIT $2 OFFSET $3
`;
```

### Step 3: Add to Module Exports

Update the `module.exports` in the query file:

```javascript
module.exports = {
  // ... existing exports
  GET_HIGHLY_RATED_WORKERS,  // Add new query
};
```

### Step 4: Update queries/index.js if Creating New Module

If creating a new query module file, import and export it:

```javascript
const newFeatureQueries = require('./new-feature.queries');

module.exports = {
  // ... existing exports
  newFeatureQueries,  // Add new module
  ...newFeatureQueries,  // Spread for backward compatibility

  queries: {
    // ... existing grouped exports
    newFeature: newFeatureQueries,
  },
};
```

### Step 5: Use the Query in Your Feature

```javascript
const { queries } = require('../database/queries');
const client = require('../database/connection');

async function getHighlyRatedWorkers(minRating, limit, offset) {
  try {
    const result = await client.query(
      queries.worker.GET_HIGHLY_RATED_WORKERS,
      [minRating, limit, offset]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching highly rated workers:', error);
    throw error;
  }
}
```

### Step 6: Test the Query

```javascript
// In your test file or route handler
const workers = await getHighlyRatedWorkers(4.0, 10, 0);
console.log('Highly rated workers:', workers);
```

### Complete Example: Adding Search Functionality

#### Query Module Addition

File: `/src/database/queries/service.queries.js`

```javascript
/**
 * Search services by keyword and category
 * Full-text search on service name and description
 */
const SEARCH_SERVICES = `
  SELECT id, name, category, description, price, rating, availability
  FROM services
  WHERE (name ILIKE $1 OR description ILIKE $1)
    AND category = $2
    AND deleted_at IS NULL
  ORDER BY rating DESC, popularity DESC
  LIMIT $3 OFFSET $4
`;

/**
 * Get services by category with pagination
 */
const GET_SERVICES_BY_CATEGORY = `
  SELECT id, name, category, description, price, rating, total_bookings
  FROM services
  WHERE category = $1 AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3
`;

module.exports = {
  SEARCH_SERVICES,
  GET_SERVICES_BY_CATEGORY,
};
```

#### Controller Usage

File: `/src/features/service/controllers/service.controller.js`

```javascript
const { queries } = require('../../../database/queries');
const client = require('../../../database/connection');

// Search services endpoint
async function searchServices(req, res) {
  const { keyword, category, limit = 10, offset = 0 } = req.query;

  try {
    // Validate inputs
    if (!keyword || !category) {
      return res.status(400).json({
        error: 'keyword and category are required',
      });
    }

    const searchKeyword = `%${keyword}%`; // ILIKE pattern

    const result = await client.query(
      queries.service.SEARCH_SERVICES,
      [searchKeyword, category, parseInt(limit), parseInt(offset)]
    );

    res.json({
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error searching services:', error);
    res.status(500).json({ error: 'Failed to search services' });
  }
}

module.exports = { searchServices };
```

---

## Migration Guide: From Inline SQL to Query Layer

### Problem with Inline SQL

**Before (Inline SQL - Problematic)**:

```javascript
const getUserProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    // Query embedded in the controller
    const query = `
      SELECT id, name, email, phone, avatar_url, status
      FROM users
      WHERE id = ${userId} AND deleted_at IS NULL
    `;

    // Vulnerable to SQL injection
    const result = await client.query(query);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Issues with this approach**:
- SQL injection vulnerability (not using parameters)
- Query duplicated if used in multiple places
- Difficult to maintain and update consistently
- Poor separation of concerns
- Hard to test queries independently

### Solution with Query Layer

**After (Using Query Layer - Recommended)**:

```javascript
// 1. Define query in queries module
// File: src/database/queries/user.queries.js
const GET_USER_PROFILE = `
  SELECT id, name, email, phone, avatar_url, status
  FROM users
  WHERE id = $1 AND deleted_at IS NULL
`;

// 2. Export from queries module
module.exports = { GET_USER_PROFILE };

// 3. Use in controller
// File: src/features/user/controllers/user.controller.js
const { queries } = require('../../../database/queries');
const client = require('../../../database/connection');

const getUserProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await client.query(
      queries.user.GET_USER_PROFILE,
      [userId]  // Parameters prevent SQL injection
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getUserProfile };
```

### Migration Steps

#### 1. Identify Inline SQL Queries

Search for `SELECT`, `INSERT`, `UPDATE`, `DELETE` statements in controllers:

```bash
grep -r "SELECT\|INSERT\|UPDATE\|DELETE" src/features/*/controllers/ --include="*.js"
```

#### 2. Create Query Constant

Move SQL to appropriate query module:

```javascript
// BEFORE
const query = `SELECT * FROM users WHERE id = ${id}`;

// AFTER
const GET_USER = `SELECT * FROM users WHERE id = $1`;
```

#### 3. Update Imports

Replace inline query with centralized import:

```javascript
// BEFORE
const { ... } = req.body;

// AFTER
const { queries } = require('../database/queries');
const client = require('../database/connection');
```

#### 4. Update Query Execution

Replace query string with parameterized version:

```javascript
// BEFORE
const result = await client.query(query);

// AFTER
const result = await client.query(
  queries.user.GET_USER,
  [userId]
);
```

#### 5. Test After Migration

Ensure functionality remains the same:

```javascript
// Test the migrated functionality
async function testUserFetch() {
  const userId = 1;
  const result = await client.query(
    queries.user.GET_USER,
    [userId]
  );
  console.log('User:', result.rows[0]);
}
```

### Migration Example: Complete Controller Refactoring

**Before (Inline SQL)**:

```javascript
const updateUserProfile = async (req, res) => {
  const { name, email, phone } = req.body;
  const userId = req.user.id;

  try {
    const query = `
      UPDATE users
      SET name = '${name}',
          email = '${email}',
          phone = '${phone}',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
      RETURNING id, name, email, phone;
    `;

    const result = await client.query(query);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**After (Query Layer)**:

```javascript
// 1. Query Module
// File: src/database/queries/user.queries.js
const UPDATE_USER_PROFILE = `
  UPDATE users
  SET name = $2,
      email = $3,
      phone = $4,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING id, name, email, phone;
`;

module.exports = { UPDATE_USER_PROFILE };

// 2. Controller
// File: src/features/user/controllers/user.controller.js
const { queries } = require('../../../database/queries');
const client = require('../../../database/connection');

const updateUserProfile = async (req, res) => {
  const { name, email, phone } = req.body;
  const userId = req.user.id;

  try {
    // Validate inputs
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await client.query(
      queries.user.UPDATE_USER_PROFILE,
      [userId, name, email, phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = { updateUserProfile };
```

**Benefits of Migration**:
- SQL injection prevention through parameterization
- Query reusability across multiple controllers
- Centralized maintenance point
- Easier testing and debugging
- Better code organization
- Consistent error handling

---

## Benefits of Centralized Queries

### 1. Security

**SQL Injection Prevention**:
- Centralized location for parameterized queries
- All queries use `$1, $2, $3...` placeholder syntax
- Dynamic values never interpolated into query strings
- Reduces attack surface significantly

### 2. Maintainability

**Single Source of Truth**:
- All queries in dedicated modules
- Easy to find and update queries
- Reduced code duplication
- Clear audit trail of query changes

**Example**: If you need to update a query used in 5 different controllers, you only change it in one place:

```javascript
// Update the query once
const GET_USER = `
  SELECT id, name, email, phone, avatar_url, status, created_at
  FROM users
  WHERE id = $1 AND deleted_at IS NULL;
`;

// All 5 controllers automatically use the updated query
```

### 3. Performance

**Query Optimization**:
- Easy to identify and optimize frequently-used queries
- Query execution plans can be cached
- Supports prepared statements for better performance
- Database query statistics centralized

### 4. Consistency

**Uniform Data Retrieval**:
- Same query logic across all endpoints
- Consistent column selection and filtering
- Standardized pagination patterns
- Uniform soft delete handling

### 5. Testing

**Easier Test Coverage**:
- Queries can be tested independently
- Mocking is simpler
- Clear dependencies visible
- Query behavior documented

```javascript
// Example: Testing a query module
describe('User Queries', () => {
  test('GET_USER_BY_ID includes correct columns', () => {
    expect(GET_USER_BY_ID).toContain('id');
    expect(GET_USER_BY_ID).toContain('name');
    expect(GET_USER_BY_ID).toContain('email');
  });

  test('GET_USER_BY_ID filters deleted users', () => {
    expect(GET_USER_BY_ID).toContain('deleted_at IS NULL');
  });
});
```

### 6. Documentation

**Self-Documenting**:
- Query names clearly describe their purpose
- Module organization mirrors business domains
- JSDoc comments explain complex queries
- Easy to generate query documentation

```javascript
/**
 * GET_AVAILABLE_WORKERS_BY_LOCATION
 *
 * Retrieves all available workers within a specified location
 * Ordered by rating (highest first) and job count
 *
 * Parameters:
 *   $1 - location (string): City or area name
 *   $2 - limit (number): Maximum results to return
 *   $3 - offset (number): Results offset for pagination
 *
 * Returns: Array of worker objects with id, name, specialization, rating, etc.
 */
const GET_AVAILABLE_WORKERS_BY_LOCATION = `...`;
```

### 7. Version Control

**Easy Tracking**:
- Query changes tracked in git history
- Reviewable query modifications
- Rollback capability for query changes
- Clear blame history

### 8. Analytics

**Query Monitoring**:
- Track which queries are most used
- Identify slow queries
- Database performance insights
- Resource utilization analysis

---

## Common Query Patterns

### 1. Pagination

```javascript
const GET_PAGINATED_RESULTS = `
  SELECT * FROM table_name
  WHERE deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2
`;

// Usage
const limit = 10;
const page = 1;
const offset = (page - 1) * limit;
const result = await client.query(GET_PAGINATED_RESULTS, [limit, offset]);
```

### 2. Filtering with Multiple Conditions

```javascript
const SEARCH_WORKERS = `
  SELECT * FROM workers
  WHERE specialization = $1
    AND hourly_rate <= $2
    AND rating >= $3
    AND is_available = true
    AND deleted_at IS NULL
  ORDER BY rating DESC
  LIMIT $4 OFFSET $5
`;
```

### 3. Counting with Status

```javascript
const COUNT_BOOKINGS_BY_STATUS = `
  SELECT status, COUNT(*) as count
  FROM bookings
  WHERE user_id = $1 AND deleted_at IS NULL
  GROUP BY status
`;
```

### 4. Date Range Queries

```javascript
const GET_BOOKINGS_IN_RANGE = `
  SELECT * FROM bookings
  WHERE user_id = $1
    AND scheduled_date >= $2
    AND scheduled_date <= $3
    AND deleted_at IS NULL
  ORDER BY scheduled_date DESC
`;

// Usage
const startDate = '2024-01-01';
const endDate = '2024-12-31';
const result = await client.query(
  GET_BOOKINGS_IN_RANGE,
  [userId, startDate, endDate]
);
```

### 5. Join Operations

```javascript
const GET_BOOKING_WITH_DETAILS = `
  SELECT b.id, b.status, b.scheduled_date,
         u.name as user_name, u.email as user_email,
         w.name as worker_name, w.specialization
  FROM bookings b
  JOIN users u ON b.user_id = u.id
  JOIN workers w ON b.worker_id = w.id
  WHERE b.id = $1 AND b.deleted_at IS NULL
`;
```

### 6. Aggregations

```javascript
const GET_WORKER_STATS = `
  SELECT id, name,
         COUNT(*) as total_bookings,
         AVG(rating) as average_rating,
         SUM(earnings) as total_earnings
  FROM workers
  WHERE deleted_at IS NULL
  GROUP BY id, name
  ORDER BY average_rating DESC
`;
```

---

## Troubleshooting

### Issue: Query returns unexpected results

**Check list**:
1. Verify parameter order matches query placeholders
2. Ensure `deleted_at IS NULL` is included (for soft deletes)
3. Check data types match database schema
4. Verify indices on filtered columns

### Issue: SQL injection still occurring

**Solutions**:
1. Always use parameter placeholders (`$1, $2...`)
2. Never use template literals for query building
3. Use COALESCE for optional values instead of conditional strings
4. Review recent SQL code changes

### Issue: Slow query performance

**Solutions**:
1. Check for missing indices
2. Use EXPLAIN ANALYZE to debug
3. Review ORDER BY and WHERE clauses
4. Consider query optimization or data structure changes

### Issue: Transaction failures

**Solutions**:
1. Ensure all queries use the same connection
2. Properly handle COMMIT/ROLLBACK
3. Check for deadlocks in concurrent operations
4. Review transaction isolation levels

---

## Database Connection Reference

The database connection is configured in `/src/database/connection.js`:

```javascript
const { Client } = require("pg");

const client = new Client({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  port: process.env.DB_PORT || 5432,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "clicksolver",
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect()
  .then(() => console.log("Connected to PostgreSQL database"))
  .catch((err) => console.error("Connection error", err));

module.exports = client;
```

---

## Summary

The centralized queries layer provides:

- **Security**: Parameterized queries prevent SQL injection
- **Organization**: Queries grouped by business domain
- **Maintainability**: Single source of truth for all SQL
- **Reusability**: Queries shared across multiple controllers
- **Consistency**: Uniform data access patterns
- **Testing**: Easy to test and mock database operations
- **Documentation**: Self-documenting code with clear patterns
- **Performance**: Opportunities for query optimization
- **Version Control**: Easy tracking of query changes

By following the patterns and practices documented here, you'll build a robust, secure, and maintainable database layer for the ClickSolver application.
