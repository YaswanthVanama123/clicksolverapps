# Query Migration Guide

A comprehensive guide for migrating inline SQL queries to a centralized query layer for improved maintainability, reusability, and testing.

## Table of Contents

1. [Why Centralize Queries](#why-centralize-queries)
2. [Step-by-Step Migration Guide](#step-by-step-migration-guide)
3. [Before/After Code Examples](#beforeafter-code-examples)
4. [Handling Dynamic Queries](#handling-dynamic-queries)
5. [Testing Migrated Code](#testing-migrated-code)
6. [Common Patterns and Best Practices](#common-patterns-and-best-practices)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## Why Centralize Queries

### Benefits of Query Centralization

#### 1. **Maintainability**
- **Single Source of Truth**: Query definitions are defined once and reused everywhere
- **Easier Updates**: Modify query logic in one place, changes apply across the entire application
- **Reduced Duplication**: Eliminates repeated SQL string definitions in multiple controller files

**Example Problem**: Same query defined in 3 different controllers
```javascript
// auth.controller.js
const userQuery = `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`;

// user.controller.js
const userQuery = `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`;

// worker.controller.js
const userQuery = `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`;
```

**Result**: Fixing a bug means updating all three locations, creating inconsistency risk.

#### 2. **Performance Optimization**
- **Query Caching**: Cache compiled queries at the query layer
- **Batch Operations**: Combine multiple related queries efficiently
- **Query Analysis**: Easy to identify and optimize slow queries since they're all in one location
- **Connection Pooling**: Better management of database connections through a centralized layer

#### 3. **Security**
- **Parameterized Queries**: Centralized enforcement of parameterized queries prevents SQL injection
- **Input Validation**: Implement validation logic once for all query uses
- **Audit Trail**: Easy to audit and log all database operations
- **Consistent Error Handling**: Standardized approach to handling database errors

#### 4. **Testability**
- **Isolated Testing**: Test queries independently from business logic
- **Mock Queries**: Easy to mock query layer for unit tests
- **Query Coverage**: Track which queries are tested
- **Performance Testing**: Benchmark queries in isolation

#### 5. **Documentation**
- **Self-Documenting**: Query names describe their purpose
- **Version Control**: Track query changes through git history
- **Comments**: Add comprehensive comments explaining complex queries
- **Query Metadata**: Store query execution metadata and indexes

#### 6. **Consistency**
- **Naming Conventions**: Standardize query naming across the codebase
- **Field Mapping**: Consistent column selection patterns
- **Error Messages**: Uniform error handling and messages
- **Pagination**: Standard approach to pagination across all queries

#### 7. **Reusability**
- **Composition**: Build complex queries from simpler ones
- **Sharing**: Use same query in multiple features without duplication
- **Extensibility**: Easy to add query variants for different use cases
- **Abstraction**: Hide database implementation details

#### 8. **Debugging**
- **Query Logging**: Log all queries in one place for debugging
- **Execution Plans**: Easy to analyze query execution plans
- **Performance Metrics**: Track execution time and resource usage
- **Error Context**: Consistent error information for troubleshooting

---

## Step-by-Step Migration Guide

### Phase 1: Preparation

#### Step 1: Identify Inline Queries
1. Search your codebase for inline SQL queries:
   ```bash
   grep -r "SELECT\|INSERT\|UPDATE\|DELETE" src/features --include="*.js" | grep -v "node_modules"
   ```

2. Document all inline queries found:
   - Which file contains it
   - What feature/controller uses it
   - Current query string
   - Parameters used
   - Frequency of use (one-off vs. frequently used)

3. Categorize queries:
   - **SELECT queries**: Data retrieval (highest priority)
   - **INSERT queries**: Data creation (medium priority)
   - **UPDATE queries**: Data modification (medium priority)
   - **DELETE queries**: Data removal (include soft deletes)

#### Step 2: Create Query Module Structure
```javascript
// src/database/queries/[feature-name].queries.js

/**
 * [Feature Name] Database Queries
 * Contains common SQL queries for [feature] operations
 *
 * Naming Convention: [action][Entity][Condition]Query
 * Examples:
 * - getUserByIdQuery
 * - getBookingsByUserQuery
 * - createPaymentQuery
 * - updateWorkerStatusQuery
 * - deleteExpiredSessionsQuery
 */

// Standard SELECT queries
const get[Entity]ByIdQuery = `
  SELECT id, column1, column2, column3
  FROM table_name
  WHERE id = $1 AND deleted_at IS NULL;
`;

// List/pagination queries
const getAll[Entities]Query = `
  SELECT id, column1, column2, column3
  FROM table_name
  WHERE deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2;
`;

// Create/Insert queries
const create[Entity]Query = `
  INSERT INTO table_name (column1, column2, column3, created_at, updated_at)
  VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, column1, column2, column3, created_at, updated_at;
`;

// Update queries
const update[Entity]Query = `
  UPDATE table_name
  SET column1 = COALESCE($2, column1),
      column2 = COALESCE($3, column2),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, column1, column2, column3, updated_at;
`;

// Export all queries
module.exports = {
  get[Entity]ByIdQuery,
  getAll[Entities]Query,
  create[Entity]Query,
  update[Entity]Query,
  // ... other queries
};
```

#### Step 3: Update Index File
```javascript
// src/database/queries/index.js

const userQueries = require('./user.queries');
const bookingQueries = require('./booking.queries');
const paymentQueries = require('./payment.queries');
// ... import all query modules

module.exports = {
  ...userQueries,
  ...bookingQueries,
  ...paymentQueries,
  // ... export all queries
};
```

### Phase 2: Migration

#### Step 4: Move Queries from Controllers
1. Identify all queries in a specific controller file
2. Copy query strings to appropriate query module
3. Rename parameters to standard format ($1, $2, etc.)
4. Add JSDoc comments explaining the query purpose

#### Step 5: Create Query Wrapper Functions (Optional but Recommended)
```javascript
// src/database/queries/user.queries.js

// Query definitions
const getUserByIdQuery = `...`;

// Wrapper function (optional)
const getUserById = async (userId) => {
  const client = require('../connection');
  try {
    const result = await client.query(getUserByIdQuery, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
};

module.exports = {
  getUserByIdQuery,
  getUserById,
};
```

#### Step 6: Update Controllers to Use Centralized Queries
1. Import queries from query module
2. Replace inline SQL with imported query constant or wrapper function
3. Test functionality remains unchanged

#### Step 7: Verification
- Ensure no inline queries remain in controllers
- Run all tests to verify functionality
- Check application still works with all features

### Phase 3: Optimization

#### Step 8: Add Query Helpers
```javascript
// src/database/queryHelpers.js

const queryHelpers = {
  // Build WHERE clauses dynamically
  buildWhereClause: (conditions = {}) => {
    const clauses = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        clauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    return {
      where: clauses.length > 0 ? 'WHERE ' + clauses.join(' AND ') : '',
      values,
    };
  },

  // Build ORDER BY clauses
  buildOrderClause: (sortBy, sortOrder = 'DESC') => {
    const validColumns = ['created_at', 'updated_at', 'name', 'status'];
    const column = validColumns.includes(sortBy) ? sortBy : 'created_at';
    return `ORDER BY ${column} ${sortOrder.toUpperCase()}`;
  },

  // Build pagination
  buildPagination: (limit = 10, offset = 0) => {
    return { limit: Math.min(limit, 100), offset };
  },
};

module.exports = queryHelpers;
```

#### Step 9: Create Query Execution Layer
```javascript
// src/database/queryExecutor.js

const client = require('./connection');

class QueryExecutor {
  /**
   * Execute a SELECT query
   * @param {string} query - SQL query string
   * @param {array} params - Query parameters
   * @returns {object} Single row or null
   */
  static async fetchOne(query, params = []) {
    try {
      const result = await client.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      throw this.handleError(error, query, params);
    }
  }

  /**
   * Execute a SELECT query returning multiple rows
   * @param {string} query - SQL query string
   * @param {array} params - Query parameters
   * @returns {array} Array of rows
   */
  static async fetchAll(query, params = []) {
    try {
      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      throw this.handleError(error, query, params);
    }
  }

  /**
   * Execute an INSERT/UPDATE/DELETE query
   * @param {string} query - SQL query string
   * @param {array} params - Query parameters
   * @returns {object} Result with rowCount
   */
  static async execute(query, params = []) {
    try {
      const result = await client.query(query, params);
      return {
        rowCount: result.rowCount,
        data: result.rows,
      };
    } catch (error) {
      throw this.handleError(error, query, params);
    }
  }

  /**
   * Execute multiple queries in a transaction
   * @param {array} queries - Array of {query, params} objects
   * @returns {array} Results for each query
   */
  static async executeTransaction(queries) {
    const pgClient = await client.connect();
    try {
      await pgClient.query('BEGIN');
      const results = [];

      for (const {query, params} of queries) {
        const result = await pgClient.query(query, params);
        results.push(result);
      }

      await pgClient.query('COMMIT');
      return results;
    } catch (error) {
      await pgClient.query('ROLLBACK');
      throw this.handleError(error, 'transaction', []);
    } finally {
      pgClient.release();
    }
  }

  /**
   * Standardized error handling
   */
  static handleError(error, query, params) {
    console.error('Query Error:', {
      message: error.message,
      query: query.substring(0, 100),
      params,
      code: error.code,
    });

    const errorMap = {
      '23505': 'Duplicate entry found',
      '23503': 'Foreign key constraint violation',
      '42P01': 'Table does not exist',
      'ECONNREFUSED': 'Database connection failed',
    };

    const customMessage = errorMap[error.code] || 'Database query failed';
    return new Error(customMessage);
  }
}

module.exports = QueryExecutor;
```

---

## Before/After Code Examples

### Example 1: Simple SELECT Query

#### Before (Inline SQL)
```javascript
// src/features/user/controllers/user-profile.controller.js

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Inline SQL query
    const query = `
      SELECT id, name, email, phone, avatar_url, status, created_at, updated_at
      FROM users
      WHERE id = $1 AND deleted_at IS NULL;
    `;

    const client = require('../../../database/connection');
    const result = await client.query(query, [userId]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getUserProfile };
```

#### After (Centralized Query)
```javascript
// src/database/queries/user.queries.js

const getUserByIdQuery = `
  SELECT id, name, email, phone, avatar_url, status, created_at, updated_at
  FROM users
  WHERE id = $1 AND deleted_at IS NULL;
`;

module.exports = {
  getUserByIdQuery,
};
```

```javascript
// src/features/user/controllers/user-profile.controller.js

const { getUserByIdQuery } = require('../../../database/queries');
const client = require('../../../database/connection');

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await client.query(getUserByIdQuery, [userId]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getUserProfile };
```

### Example 2: INSERT with Multiple Parameters

#### Before (Inline SQL)
```javascript
// src/features/booking/controllers/booking-request.controller.js

const createBooking = async (req, res) => {
  try {
    const { userId, workerId, serviceType, description, location, lat, lng, scheduledDate, scheduledTime, estimatedAmount } = req.body;

    // Inline SQL with multiple parameters
    const query = `
      INSERT INTO bookings (user_id, worker_id, service_type, description, location,
                           latitude, longitude, scheduled_date, scheduled_time, status,
                           estimated_amount, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, user_id, worker_id, service_type, description, location,
               latitude, longitude, scheduled_date, scheduled_time, status,
               estimated_amount, actual_amount, created_at, updated_at;
    `;

    const client = require('../../../database/connection');
    const result = await client.query(query, [
      userId, workerId, serviceType, description, location,
      lat, lng, scheduledDate, scheduledTime, 'pending',
      estimatedAmount
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createBooking };
```

#### After (Centralized Query)
```javascript
// src/database/queries/booking.queries.js

const createBookingQuery = `
  INSERT INTO bookings (user_id, worker_id, service_type, description, location,
                       latitude, longitude, scheduled_date, scheduled_time, status,
                       estimated_amount, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, user_id, worker_id, service_type, description, location,
           latitude, longitude, scheduled_date, scheduled_time, status,
           estimated_amount, actual_amount, created_at, updated_at;
`;

module.exports = {
  createBookingQuery,
};
```

```javascript
// src/features/booking/controllers/booking-request.controller.js

const { createBookingQuery } = require('../../../database/queries');
const client = require('../../../database/connection');

const createBooking = async (req, res) => {
  try {
    const { userId, workerId, serviceType, description, location, lat, lng, scheduledDate, scheduledTime, estimatedAmount } = req.body;

    const result = await client.query(createBookingQuery, [
      userId, workerId, serviceType, description, location,
      lat, lng, scheduledDate, scheduledTime, 'pending',
      estimatedAmount
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createBooking };
```

### Example 3: Complex UPDATE Query

#### Before (Inline SQL)
```javascript
// src/features/auth/controllers/auth-cron.controller.js

const updateWorkerNoDueStatus = async () => {
  try {
    // Complex inline query
    const updateQuery = `
      UPDATE workersverified wv
      SET no_due = CASE
        WHEN wl.balance_amount < -50 THEN FALSE
        WHEN wl.balance_amount >= -50 THEN TRUE
      END
      FROM workerlife wl
      WHERE wv.worker_id = wl.worker_id;
    `;

    const client = require('../../database/connection');
    const result = await client.query(updateQuery);

    console.log(`Updated ${result.rowCount} workers' no_due status.`);
  } catch (error) {
    console.error('Error updating no_due status:', error);
  }
};
```

#### After (Centralized Query)
```javascript
// src/database/queries/worker.queries.js

/**
 * Update worker no_due status based on balance amount
 * Sets no_due = FALSE if balance < -50, TRUE otherwise
 */
const updateWorkerNoDueStatusQuery = `
  UPDATE workersverified wv
  SET no_due = CASE
    WHEN wl.balance_amount < -50 THEN FALSE
    WHEN wl.balance_amount >= -50 THEN TRUE
  END
  FROM workerlife wl
  WHERE wv.worker_id = wl.worker_id;
`;

module.exports = {
  updateWorkerNoDueStatusQuery,
};
```

```javascript
// src/features/auth/controllers/auth-cron.controller.js

const { updateWorkerNoDueStatusQuery } = require('../../database/queries');
const client = require('../../database/connection');

const updateWorkerNoDueStatus = async () => {
  try {
    const result = await client.query(updateWorkerNoDueStatusQuery);
    console.log(`Updated ${result.rowCount} workers' no_due status.`);
  } catch (error) {
    console.error('Error updating no_due status:', error);
  }
};
```

---

## Handling Dynamic Queries

### Problem Statement
Not all queries are static. Some queries need to be built dynamically based on filters, sorting, and pagination parameters.

### Solution 1: Query Builder Pattern

```javascript
// src/database/queryBuilders/bookingQueryBuilder.js

class BookingQueryBuilder {
  constructor() {
    this.baseQuery = 'SELECT * FROM bookings WHERE deleted_at IS NULL';
    this.conditions = [];
    this.params = [];
    this.paramIndex = 1;
  }

  /**
   * Add status filter
   */
  withStatus(status) {
    if (status) {
      this.conditions.push(`status = $${this.paramIndex}`);
      this.params.push(status);
      this.paramIndex++;
    }
    return this;
  }

  /**
   * Add user filter
   */
  forUser(userId) {
    if (userId) {
      this.conditions.push(`user_id = $${this.paramIndex}`);
      this.params.push(userId);
      this.paramIndex++;
    }
    return this;
  }

  /**
   * Add worker filter
   */
  forWorker(workerId) {
    if (workerId) {
      this.conditions.push(`worker_id = $${this.paramIndex}`);
      this.params.push(workerId);
      this.paramIndex++;
    }
    return this;
  }

  /**
   * Add date range filter
   */
  betweenDates(startDate, endDate) {
    if (startDate) {
      this.conditions.push(`scheduled_date >= $${this.paramIndex}`);
      this.params.push(startDate);
      this.paramIndex++;
    }
    if (endDate) {
      this.conditions.push(`scheduled_date <= $${this.paramIndex}`);
      this.params.push(endDate);
      this.paramIndex++;
    }
    return this;
  }

  /**
   * Add sorting
   */
  orderBy(field = 'created_at', direction = 'DESC') {
    const validFields = ['created_at', 'updated_at', 'scheduled_date', 'status'];
    this.sortField = validFields.includes(field) ? field : 'created_at';
    this.sortDirection = direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    return this;
  }

  /**
   * Add pagination
   */
  paginate(limit = 10, offset = 0) {
    this.limit = Math.min(limit, 100);
    this.offset = offset;
    return this;
  }

  /**
   * Build final query
   */
  build() {
    let query = this.baseQuery;

    // Add conditions
    if (this.conditions.length > 0) {
      query += ' AND ' + this.conditions.join(' AND ');
    }

    // Add sorting
    if (this.sortField) {
      query += ` ORDER BY ${this.sortField} ${this.sortDirection}`;
    } else {
      query += ' ORDER BY created_at DESC';
    }

    // Add pagination
    if (this.limit) {
      query += ` LIMIT $${this.paramIndex} OFFSET $${this.paramIndex + 1}`;
      this.params.push(this.limit);
      this.params.push(this.offset);
    }

    query += ';';

    return { query, params: this.params };
  }
}

module.exports = BookingQueryBuilder;
```

### Usage Example

```javascript
// src/features/booking/controllers/booking-request.controller.js

const BookingQueryBuilder = require('../../../database/queryBuilders/bookingQueryBuilder');
const client = require('../../../database/connection');

const listBookings = async (req, res) => {
  try {
    const { status, userId, workerId, startDate, endDate, sortBy, sortDir, limit, offset } = req.query;

    // Build dynamic query
    const builder = new BookingQueryBuilder()
      .withStatus(status)
      .forUser(userId)
      .forWorker(workerId)
      .betweenDates(startDate, endDate)
      .orderBy(sortBy, sortDir)
      .paginate(parseInt(limit) || 10, parseInt(offset) || 0);

    const { query, params } = builder.build();

    const result = await client.query(query, params);

    res.json({
      bookings: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { listBookings };
```

### Solution 2: Template-Based Dynamic Queries

```javascript
// src/database/queries/templates.js

/**
 * Build dynamic WHERE clause for bookings search
 */
const buildBookingFilterQuery = (filters = {}) => {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // Template for common filters
  const filterTemplates = {
    status: `status = $${paramIndex}`,
    userId: `user_id = $${paramIndex}`,
    workerId: `worker_id = $${paramIndex}`,
    minAmount: `estimated_amount >= $${paramIndex}`,
    maxAmount: `estimated_amount <= $${paramIndex}`,
    startDate: `scheduled_date >= $${paramIndex}`,
    endDate: `scheduled_date <= $${paramIndex}`,
  };

  // Build conditions based on provided filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && filterTemplates[key]) {
      conditions.push(filterTemplates[key]);
      params.push(value);
      paramIndex++;
    }
  });

  const whereClause = conditions.length > 0
    ? 'WHERE deleted_at IS NULL AND ' + conditions.join(' AND ')
    : 'WHERE deleted_at IS NULL';

  return { whereClause, params };
};

/**
 * Build dynamic SELECT query with filters and pagination
 */
const buildSelectQuery = (
  table,
  columns = ['*'],
  whereClause = '',
  orderBy = 'created_at DESC',
  limit = null,
  offset = null
) => {
  let query = `SELECT ${columns.join(', ')} FROM ${table} ${whereClause}`;

  if (orderBy) {
    query += ` ORDER BY ${orderBy}`;
  }

  if (limit) {
    query += ` LIMIT ${limit}`;
  }

  if (offset) {
    query += ` OFFSET ${offset}`;
  }

  query += ';';

  return query;
};

module.exports = {
  buildBookingFilterQuery,
  buildSelectQuery,
};
```

### Solution 3: Parameterized Query Templates

```javascript
// src/database/queries/search.queries.js

/**
 * Search bookings with multiple optional filters
 * Usage:
 * const { query, params } = buildSearchBookingsQuery({
 *   status: 'pending',
 *   userId: 123,
 *   limit: 10,
 *   offset: 0
 * });
 */
const buildSearchBookingsQuery = (filters = {}) => {
  const {
    status,
    userId,
    workerId,
    serviceType,
    startDate,
    endDate,
    limit = 10,
    offset = 0,
  } = filters;

  const conditions = ['deleted_at IS NULL'];
  const params = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  if (userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(userId);
  }

  if (workerId) {
    conditions.push(`worker_id = $${paramIndex++}`);
    params.push(workerId);
  }

  if (serviceType) {
    conditions.push(`service_type = $${paramIndex++}`);
    params.push(serviceType);
  }

  if (startDate) {
    conditions.push(`scheduled_date >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`scheduled_date <= $${paramIndex++}`);
    params.push(endDate);
  }

  params.push(limit);
  params.push(offset);

  const query = `
    SELECT id, user_id, worker_id, service_type, description, location,
           latitude, longitude, scheduled_date, scheduled_time, status,
           estimated_amount, actual_amount, created_at, updated_at
    FROM bookings
    WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++};
  `;

  return { query, params };
};

module.exports = {
  buildSearchBookingsQuery,
};
```

---

## Testing Migrated Code

### Unit Tests for Queries

```javascript
// tests/database/queries/user.queries.test.js

const client = require('../../../src/database/connection');
const { getUserByIdQuery, createUserQuery, updateUserQuery } = require('../../../src/database/queries/user.queries');

describe('User Queries', () => {
  // Mock client for unit tests
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
    };
  });

  describe('getUserByIdQuery', () => {
    test('should select correct columns', () => {
      const expectedColumns = [
        'id', 'name', 'email', 'phone', 'avatar_url', 'status', 'created_at', 'updated_at'
      ];

      expectedColumns.forEach(column => {
        expect(getUserByIdQuery).toContain(column);
      });
    });

    test('should filter by id', () => {
      expect(getUserByIdQuery).toContain('WHERE id = $1');
    });

    test('should exclude soft-deleted users', () => {
      expect(getUserByIdQuery).toContain('deleted_at IS NULL');
    });

    test('should terminate with semicolon', () => {
      expect(getUserByIdQuery.trim().endsWith(';')).toBe(true);
    });
  });

  describe('createUserQuery', () => {
    test('should insert all required fields', () => {
      const requiredFields = ['name', 'email', 'phone', 'avatar_url', 'status'];
      requiredFields.forEach(field => {
        expect(createUserQuery).toContain(field);
      });
    });

    test('should set timestamps', () => {
      expect(createUserQuery).toContain('CURRENT_TIMESTAMP');
    });

    test('should return created record', () => {
      expect(createUserQuery).toContain('RETURNING');
    });
  });
});
```

### Integration Tests

```javascript
// tests/database/queries/user.integration.test.js

const client = require('../../../src/database/connection');
const { getUserByIdQuery, createUserQuery } = require('../../../src/database/queries/user.queries');

describe('User Queries Integration', () => {
  const testUserId = 'test-user-123';

  afterAll(async () => {
    // Clean up test data
    await client.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('getUserByIdQuery', () => {
    test('should retrieve user by id', async () => {
      // Create test user
      const createResult = await client.query(createUserQuery, [
        'Test User',
        'test@example.com',
        '1234567890',
        'http://avatar.jpg',
        'active',
      ]);

      const userId = createResult.rows[0].id;

      // Test the query
      const result = await client.query(getUserByIdQuery, [userId]);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0]).toHaveProperty('name', 'Test User');
      expect(result.rows[0]).toHaveProperty('email', 'test@example.com');
    });

    test('should return empty for non-existent user', async () => {
      const result = await client.query(getUserByIdQuery, ['non-existent-id']);
      expect(result.rows.length).toBe(0);
    });

    test('should exclude soft-deleted users', async () => {
      // Create and soft-delete a user
      const createResult = await client.query(createUserQuery, [
        'Deleted User',
        'deleted@example.com',
        '0987654321',
        'http://avatar.jpg',
        'active',
      ]);

      const userId = createResult.rows[0].id;

      // Soft delete
      await client.query('UPDATE users SET deleted_at = NOW() WHERE id = $1', [userId]);

      // Query should return no results
      const result = await client.query(getUserByIdQuery, [userId]);
      expect(result.rows.length).toBe(0);
    });
  });
});
```

### Controller Tests with Mocked Queries

```javascript
// tests/features/user/controllers/user-profile.controller.test.js

const { getUserProfile } = require('../../../src/features/user/controllers/user-profile.controller');
const client = require('../../../src/database/connection');

jest.mock('../../../src/database/connection');

describe('getUserProfile Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { userId: '123' },
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  test('should return user profile for valid user id', async () => {
    const mockUser = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      status: 'active',
    };

    client.query.mockResolvedValue({ rows: [mockUser] });

    await getUserProfile(req, res);

    expect(res.json).toHaveBeenCalledWith(mockUser);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should return 404 for non-existent user', async () => {
    client.query.mockResolvedValue({ rows: [] });

    await getUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('should handle database errors', async () => {
    const dbError = new Error('Database connection failed');
    client.query.mockRejectedValue(dbError);

    await getUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
```

### Query Performance Tests

```javascript
// tests/database/queries/performance.test.js

const client = require('../../../src/database/connection');
const { getBookingsByUserQuery } = require('../../../src/database/queries/booking.queries');

describe('Query Performance', () => {
  test('should retrieve bookings within acceptable time', async () => {
    const userId = 'test-user';
    const startTime = Date.now();

    await client.query(getBookingsByUserQuery, [userId, 100, 0]);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Query should complete within 500ms
    expect(executionTime).toBeLessThan(500);
  });

  test('should handle large result sets', async () => {
    // This test assumes database has sufficient test data
    const result = await client.query(getBookingsByUserQuery, ['user123', 1000, 0]);

    // Should handle pagination
    expect(result.rows).toBeDefined();
    expect(Array.isArray(result.rows)).toBe(true);
  });
});
```

---

## Common Patterns and Best Practices

### 1. Naming Conventions

**Query Naming Pattern**: `[Verb][Entity][Condition]Query`

```javascript
// SELECT queries
getUserByIdQuery
getUserByEmailQuery
getBookingsByUserQuery
getAllActiveBookingsQuery
getBookingCountQuery

// INSERT queries
createUserQuery
createBookingQuery
createPaymentQuery

// UPDATE queries
updateUserStatusQuery
updateBookingStatusQuery
updateWorkerBalanceQuery

// DELETE queries
deleteExpiredSessionsQuery
deleteOldLogsQuery
deactivateInactiveUsersQuery
```

### 2. Query Organization

```javascript
// src/database/queries/[feature].queries.js

/**
 * [Feature Name] Database Queries
 *
 * This module contains all SQL queries related to [feature] operations.
 * Queries are organized by operation type (SELECT, INSERT, UPDATE, DELETE).
 */

// ============================================================================
// SELECT QUERIES
// ============================================================================

const getUserByIdQuery = `...`;
const getActiveUsersQuery = `...`;

// ============================================================================
// INSERT QUERIES
// ============================================================================

const createUserQuery = `...`;

// ============================================================================
// UPDATE QUERIES
// ============================================================================

const updateUserStatusQuery = `...`;

// ============================================================================
// DELETE QUERIES
// ============================================================================

const deactivateUserQuery = `...`;

// Exports
module.exports = {
  // SELECT
  getUserByIdQuery,
  getActiveUsersQuery,
  // INSERT
  createUserQuery,
  // UPDATE
  updateUserStatusQuery,
  // DELETE
  deactivateUserQuery,
};
```

### 3. Consistent Field Selection

```javascript
// DO: Explicitly list fields
const getUserByIdQuery = `
  SELECT id, name, email, phone, avatar_url, status, created_at, updated_at
  FROM users
  WHERE id = $1;
`;

// DON'T: Use wildcard (makes queries fragile)
const getUserByIdQuery = `
  SELECT *
  FROM users
  WHERE id = $1;
`;
```

### 4. Parameterized Queries

```javascript
// DO: Use parameterized queries to prevent SQL injection
const getUserByIdQuery = `
  SELECT id, name, email
  FROM users
  WHERE id = $1;
`;

// DON'T: String concatenation
const query = `SELECT * FROM users WHERE id = '${userId}'`; // Vulnerable!
```

### 5. Soft Deletes

```javascript
// Always include soft delete check
const getUserByIdQuery = `
  SELECT id, name, email, phone, avatar_url, status, created_at, updated_at
  FROM users
  WHERE id = $1 AND deleted_at IS NULL;
`;

// Soft delete operation
const deactivateUserQuery = `
  UPDATE users
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, deleted_at;
`;
```

### 6. RETURNING Clause

```javascript
// Use RETURNING to get modified data without extra query
const createUserQuery = `
  INSERT INTO users (name, email, phone, avatar_url, status, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, name, email, phone, avatar_url, status, created_at, updated_at;
`;

const updateUserQuery = `
  UPDATE users
  SET name = COALESCE($2, name),
      email = COALESCE($3, email),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, name, email, updated_at;
`;
```

### 7. Coalesce for Partial Updates

```javascript
// Use COALESCE to update only provided fields
const updateBookingQuery = `
  UPDATE bookings
  SET status = COALESCE($2, status),
      actual_amount = COALESCE($3, actual_amount),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, status, actual_amount, updated_at;
`;

// Usage: Pass null for fields not being updated
await client.query(updateBookingQuery, [bookingId, 'completed', null]);
```

### 8. Pagination Best Practices

```javascript
// Standard pagination pattern
const getBookingsByUserQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE user_id = $1 AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

// Safe pagination with max limit
const limit = Math.min(req.query.limit || 10, 100); // Max 100 items
const offset = Math.max(req.query.offset || 0, 0);

await client.query(getBookingsByUserQuery, [userId, limit, offset]);
```

### 9. Timestamps Management

```javascript
// Always include timestamps for audit trails
const createPaymentQuery = `
  INSERT INTO payments (user_id, amount, status, created_at, updated_at)
  VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, user_id, amount, status, created_at, updated_at;
`;

// Always update updated_at on modifications
const updatePaymentQuery = `
  UPDATE payments
  SET status = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING id, status, updated_at;
`;
```

### 10. Complex Joins

```javascript
// When joining multiple tables, be explicit about columns
const getBookingDetailsQuery = `
  SELECT b.id, b.user_id, b.worker_id, b.status,
         u.name AS user_name, u.email AS user_email,
         w.name AS worker_name, w.phone AS worker_phone,
         s.name AS service_name, s.description AS service_description
  FROM bookings b
  LEFT JOIN users u ON b.user_id = u.id AND u.deleted_at IS NULL
  LEFT JOIN workers w ON b.worker_id = w.id AND w.deleted_at IS NULL
  LEFT JOIN services s ON b.service_type = s.id AND s.deleted_at IS NULL
  WHERE b.id = $1 AND b.deleted_at IS NULL;
`;
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Parameter Mismatch

**Problem**: "Query has 3 parameters but only 2 were supplied"

```javascript
// ❌ Wrong: Too few parameters
const query = `
  SELECT * FROM users
  WHERE id = $1 AND status = $2 AND deleted_at IS NULL;
`;
await client.query(query, [userId]); // Missing status parameter!

// ✅ Correct: All parameters provided
await client.query(query, [userId, 'active']);
```

**Solution**:
1. Count the `$N` placeholders in your query
2. Ensure you provide matching number of parameters
3. Use this pattern: `const params = [param1, param2, param3];`
4. Verify parameter order matches query placeholders

#### Issue 2: SQL Syntax Errors

**Problem**: "Syntax error at or near..."

```javascript
// ❌ Wrong: Missing comma
const query = `
  SELECT id, name email, phone FROM users;
`;

// ✅ Correct: Proper syntax
const query = `
  SELECT id, name, email, phone FROM users;
`;
```

**Solution**:
1. Copy the query to a SQL editor (pgAdmin, DBeaver) to test
2. Check for missing commas, semicolons
3. Verify column/table names are correct
4. Use consistent formatting and indentation

#### Issue 3: NULL Handling Issues

**Problem**: Query returns unexpected results with NULL values

```javascript
// ❌ Wrong: NULL comparison fails
const query = `
  SELECT * FROM users WHERE deleted_at = NULL;
`;

// ✅ Correct: Use IS NULL
const query = `
  SELECT * FROM users WHERE deleted_at IS NULL;
`;
```

**Solution**:
1. Always use `IS NULL` or `IS NOT NULL` for NULL checks
2. Use `COALESCE()` for default values
3. Be aware that `NULL = NULL` returns NULL, not true

#### Issue 4: Performance Issues

**Problem**: Query is very slow

```javascript
// Identify bottlenecks
// 1. Check if EXPLAIN shows missing indexes
EXPLAIN ANALYZE SELECT * FROM bookings WHERE user_id = $1;

// 2. Add indexes for frequently filtered columns
CREATE INDEX idx_bookings_user_id ON bookings(user_id) WHERE deleted_at IS NULL;

// 3. Avoid SELECT * - retrieve only needed columns
// ❌ Slow: Fetches all columns
SELECT * FROM bookings WHERE user_id = $1;

// ✅ Fast: Only needed columns
SELECT id, status, created_at FROM bookings WHERE user_id = $1;
```

**Solutions**:
1. Run EXPLAIN ANALYZE to identify bottlenecks
2. Add indexes on frequently filtered/joined columns
3. Select only needed columns
4. Consider query caching for read-heavy operations
5. Use pagination for large result sets

#### Issue 5: Transaction Issues

**Problem**: Changes rolled back unexpectedly

```javascript
// ❌ Wrong: No error handling in transaction
try {
  await client.query('BEGIN');
  await client.query(query1);
  await client.query(query2); // If this fails, transaction not rolled back
  await client.query('COMMIT');
} catch (error) {
  // Missing rollback!
}

// ✅ Correct: Proper transaction handling
try {
  await client.query('BEGIN');
  await client.query(query1);
  await client.query(query2);
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
}
```

**Solution**: Use QueryExecutor transaction helper (see Step 9)

#### Issue 6: Soft Delete Confusion

**Problem**: Soft-deleted records still appearing in results

```javascript
// ❌ Wrong: No soft delete check
const query = `
  SELECT * FROM users WHERE id = $1;
`;

// ✅ Correct: Include soft delete check
const query = `
  SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL;
`;
```

**Solution**: Always include `AND deleted_at IS NULL` in SELECT queries

#### Issue 7: Type Mismatch

**Problem**: "value too long for type character varying"

```javascript
// ❌ Sending too long string
const longString = 'a'.repeat(300);
await client.query(query, [longString]); // If column is VARCHAR(255), this fails!

// ✅ Validate before sending
const maxLength = 255;
if (value.length > maxLength) {
  throw new Error(`Value exceeds maximum length of ${maxLength}`);
}
```

**Solution**:
1. Check column definitions in database
2. Validate input lengths before querying
3. Consider using TEXT type for unlimited length

#### Issue 8: Connection Pool Exhaustion

**Problem**: "connect timeout expired" or "max connections reached"

```javascript
// ❌ Wrong: Connections not released
const client = require('./connection');
// Multiple queries without releasing connection

// ✅ Correct: Use connection pooling properly
const result = await client.query(query, params);
// Connection automatically returned to pool
```

**Solution**:
1. Use connection pooling (already in place)
2. Ensure all queries use the pool client
3. Monitor connection usage
4. Check for connection leaks in long-running operations

#### Issue 9: Duplicate Key Violation

**Problem**: "duplicate key value violates unique constraint"

```javascript
// Error indicates duplicate entry
// Causes:
// 1. Inserting duplicate email/phone
// 2. Not checking if record exists before insert

// ✅ Solution: Check before insert
const existing = await client.query(getUserByEmailQuery, [email]);
if (existing.rows.length > 0) {
  throw new Error('User with this email already exists');
}

// Or use: INSERT ... ON CONFLICT DO UPDATE
const insertOrUpdateQuery = `
  INSERT INTO users (email, name)
  VALUES ($1, $2)
  ON CONFLICT (email) DO UPDATE SET name = $2
  RETURNING id, email, name;
`;
```

#### Issue 10: Timezone Issues

**Problem**: Timestamps stored/retrieved incorrectly

```javascript
// ❌ Wrong: Timezone confusion
INSERT INTO bookings (scheduled_date, created_at)
VALUES ('2024-01-28', NOW()); // NOW() uses server timezone

// ✅ Correct: Use explicit timezone
INSERT INTO bookings (scheduled_date, created_at)
VALUES ($1::timestamp with time zone, NOW() AT TIME ZONE 'UTC');

// In application
const timestamp = new Date().toISOString(); // ISO 8601 format
```

**Solution**:
1. Store all timestamps in UTC
2. Convert to local timezone in application code
3. Use ISO 8601 format for consistency
4. Document timezone expectations

### Debugging Tips

#### 1. Log Queries in Development

```javascript
// src/database/connection.js
const { Client } = require('pg');

const client = new Client(config);

// Log all queries in development
if (process.env.NODE_ENV === 'development') {
  client.on('query', (query) => {
    console.log('QUERY:', query);
  });
}
```

#### 2. Use Query Explain

```javascript
// Test query performance
const result = await client.query(`
  EXPLAIN ANALYZE
  SELECT * FROM bookings WHERE user_id = $1 LIMIT 10;
`, [userId]);

console.log(result.rows);
```

#### 3. Test Queries in SQL Client First

- Use pgAdmin or DBeaver
- Test query with sample data
- Verify results before migrating to code
- Use EXPLAIN to analyze query plan

#### 4. Add Detailed Error Logging

```javascript
catch (error) {
  console.error('Database Error:', {
    message: error.message,
    code: error.code,
    detail: error.detail,
    query: query.substring(0, 200),
    params: params,
    timestamp: new Date().toISOString(),
  });
  throw error;
}
```

---

## Migration Checklist

- [ ] Identify all inline SQL queries in the codebase
- [ ] Create query modules for each feature
- [ ] Move queries to centralized query layer
- [ ] Update controllers to use imported queries
- [ ] Verify all functionality still works
- [ ] Add JSDoc comments to queries
- [ ] Implement QueryExecutor helper class
- [ ] Add query builders for dynamic queries
- [ ] Write unit tests for queries
- [ ] Write integration tests
- [ ] Test query performance
- [ ] Document any custom query patterns
- [ ] Update team documentation
- [ ] Deploy and monitor in production

---

## Summary

Centralizing database queries provides significant benefits in maintainability, security, performance, and testing. By following the patterns and practices outlined in this guide, you can systematically migrate your codebase from inline SQL to a robust, scalable query layer.

### Key Takeaways

1. **Centralize All Queries**: Move SQL strings from controllers to dedicated query modules
2. **Use Consistent Naming**: Follow `[Verb][Entity][Condition]Query` convention
3. **Parameterize Everything**: Always use `$N` placeholders to prevent SQL injection
4. **Handle Dynamics**: Use query builders for complex, dynamic queries
5. **Test Thoroughly**: Write unit and integration tests for queries
6. **Document Well**: Add comments explaining query purpose and parameters
7. **Monitor Performance**: Use EXPLAIN to identify slow queries
8. **Maintain Conventions**: Follow established patterns for consistency

### Next Steps

1. Start with the most-used features (auth, bookings, users)
2. Migrate queries gradually, testing after each change
3. Refactor duplicate queries across multiple controllers
4. Implement query builders for frequently modified queries
5. Establish team standards and documentation

For questions or issues, refer to the troubleshooting section or consult the ARCHITECTURE.md documentation.
