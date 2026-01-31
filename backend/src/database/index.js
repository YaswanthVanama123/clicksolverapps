// Export database connection
export { default as connection } from './connection.js';

// Export all queries
export * from './queries/index.js';

// ============================================
// Query Execution Helpers
// ============================================

import connection from './connection.js';

/**
 * Execute a query with parameters
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @param {boolean} logQuery - Whether to log the query (default: false)
 * @returns {Promise<Object>} Query result
 */
export const executeQuery = async (query, params = [], logQuery = false) => {
  const startTime = Date.now();

  try {
    if (logQuery) {
      console.log('[DB Query]:', query);
      console.log('[DB Params]:', params);
    }

    const result = await connection.query(query, params);

    if (logQuery) {
      const duration = Date.now() - startTime;
      console.log(`[DB Query] Completed in ${duration}ms, returned ${result.rowCount} rows`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[DB Error] Query failed after ${duration}ms:`, error.message);
    console.error('[DB Query]:', query);
    console.error('[DB Params]:', params);
    throw new DatabaseError('Query execution failed', error, query, params);
  }
};

/**
 * Execute a query and return only the rows
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @param {boolean} logQuery - Whether to log the query
 * @returns {Promise<Array>} Query rows
 */
export const queryRows = async (query, params = [], logQuery = false) => {
  const result = await executeQuery(query, params, logQuery);
  return result.rows;
};

/**
 * Execute a query and return the first row
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @param {boolean} logQuery - Whether to log the query
 * @returns {Promise<Object|null>} First row or null
 */
export const queryOne = async (query, params = [], logQuery = false) => {
  const result = await executeQuery(query, params, logQuery);
  return result.rows[0] || null;
};

/**
 * Execute a query and return a single value from the first row
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @param {string} column - Column name to extract (default: first column)
 * @param {boolean} logQuery - Whether to log the query
 * @returns {Promise<any>} Single value
 */
export const queryValue = async (query, params = [], column = null, logQuery = false) => {
  const row = await queryOne(query, params, logQuery);
  if (!row) return null;

  if (column) {
    return row[column];
  }

  // Return first column value
  const firstKey = Object.keys(row)[0];
  return row[firstKey];
};

/**
 * Execute multiple queries in a batch
 * @param {Array<{query: string, params: Array}>} queries - Array of query objects
 * @param {boolean} logQuery - Whether to log the queries
 * @returns {Promise<Array>} Array of results
 */
export const executeBatch = async (queries, logQuery = false) => {
  const results = [];

  for (const { query, params = [] } of queries) {
    const result = await executeQuery(query, params, logQuery);
    results.push(result);
  }

  return results;
};

// ============================================
// Transaction Support
// ============================================

/**
 * Execute a function within a transaction
 * @param {Function} callback - Async function to execute within transaction
 * @param {boolean} logQuery - Whether to log transaction queries
 * @returns {Promise<any>} Result of the callback function
 */
export const withTransaction = async (callback, logQuery = false) => {
  if (logQuery) {
    console.log('[DB Transaction] Starting transaction...');
  }

  try {
    await connection.query('BEGIN');

    if (logQuery) {
      console.log('[DB Transaction] Transaction started');
    }

    const result = await callback(connection);

    await connection.query('COMMIT');

    if (logQuery) {
      console.log('[DB Transaction] Transaction committed successfully');
    }

    return result;
  } catch (error) {
    await connection.query('ROLLBACK');

    if (logQuery) {
      console.error('[DB Transaction] Transaction rolled back due to error:', error.message);
    }

    throw new DatabaseError('Transaction failed', error);
  }
};

/**
 * Begin a transaction manually
 * @param {boolean} logQuery - Whether to log the query
 * @returns {Promise<void>}
 */
export const beginTransaction = async (logQuery = false) => {
  if (logQuery) {
    console.log('[DB Transaction] BEGIN');
  }
  await connection.query('BEGIN');
};

/**
 * Commit a transaction
 * @param {boolean} logQuery - Whether to log the query
 * @returns {Promise<void>}
 */
export const commitTransaction = async (logQuery = false) => {
  if (logQuery) {
    console.log('[DB Transaction] COMMIT');
  }
  await connection.query('COMMIT');
};

/**
 * Rollback a transaction
 * @param {boolean} logQuery - Whether to log the query
 * @returns {Promise<void>}
 */
export const rollbackTransaction = async (logQuery = false) => {
  if (logQuery) {
    console.log('[DB Transaction] ROLLBACK');
  }
  await connection.query('ROLLBACK');
};

/**
 * Create a savepoint within a transaction
 * @param {string} name - Savepoint name
 * @param {boolean} logQuery - Whether to log the query
 * @returns {Promise<void>}
 */
export const savepoint = async (name, logQuery = false) => {
  if (logQuery) {
    console.log(`[DB Transaction] SAVEPOINT ${name}`);
  }
  await connection.query(`SAVEPOINT ${name}`);
};

/**
 * Rollback to a savepoint
 * @param {string} name - Savepoint name
 * @param {boolean} logQuery - Whether to log the query
 * @returns {Promise<void>}
 */
export const rollbackToSavepoint = async (name, logQuery = false) => {
  if (logQuery) {
    console.log(`[DB Transaction] ROLLBACK TO SAVEPOINT ${name}`);
  }
  await connection.query(`ROLLBACK TO SAVEPOINT ${name}`);
};

/**
 * Release a savepoint
 * @param {string} name - Savepoint name
 * @param {boolean} logQuery - Whether to log the query
 * @returns {Promise<void>}
 */
export const releaseSavepoint = async (name, logQuery = false) => {
  if (logQuery) {
    console.log(`[DB Transaction] RELEASE SAVEPOINT ${name}`);
  }
  await connection.query(`RELEASE SAVEPOINT ${name}`);
};

// ============================================
// Error Handling Utilities
// ============================================

/**
 * Custom Database Error class
 */
export class DatabaseError extends Error {
  constructor(message, originalError = null, query = null, params = null) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
    this.query = query;
    this.params = params;
    this.timestamp = new Date().toISOString();

    if (originalError) {
      this.code = originalError.code;
      this.detail = originalError.detail;
      this.hint = originalError.hint;
      this.position = originalError.position;
      this.constraint = originalError.constraint;
      this.table = originalError.table;
      this.column = originalError.column;
    }

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }

  /**
   * Check if error is a unique constraint violation
   */
  isUniqueViolation() {
    return this.code === '23505';
  }

  /**
   * Check if error is a foreign key violation
   */
  isForeignKeyViolation() {
    return this.code === '23503';
  }

  /**
   * Check if error is a not null violation
   */
  isNotNullViolation() {
    return this.code === '23502';
  }

  /**
   * Check if error is a check constraint violation
   */
  isCheckViolation() {
    return this.code === '23514';
  }

  /**
   * Get a user-friendly error message
   */
  getUserFriendlyMessage() {
    if (this.isUniqueViolation()) {
      return `A record with this ${this.constraint || 'value'} already exists.`;
    }

    if (this.isForeignKeyViolation()) {
      return 'This operation references a non-existent record.';
    }

    if (this.isNotNullViolation()) {
      return `Required field '${this.column || 'unknown'}' is missing.`;
    }

    if (this.isCheckViolation()) {
      return 'The provided data does not meet validation requirements.';
    }

    return 'A database error occurred. Please try again.';
  }

  /**
   * Convert error to JSON format
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      detail: this.detail,
      hint: this.hint,
      constraint: this.constraint,
      table: this.table,
      column: this.column,
      timestamp: this.timestamp,
      query: this.query,
      params: this.params,
    };
  }
}

/**
 * Safely handle database errors and return formatted response
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {Object} Formatted error response
 */
export const handleDatabaseError = (error, context = 'Database operation') => {
  console.error(`[${context}] Error:`, error);

  if (error instanceof DatabaseError) {
    return {
      success: false,
      error: error.getUserFriendlyMessage(),
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.toJSON() : undefined,
    };
  }

  return {
    success: false,
    error: 'An unexpected error occurred. Please try again.',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  };
};

/**
 * Retry a database operation with exponential backoff
 * @param {Function} operation - Async function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} initialDelay - Initial delay in ms (default: 1000)
 * @returns {Promise<any>} Result of the operation
 */
export const retryOperation = async (operation, maxRetries = 3, initialDelay = 1000) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`[DB Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new DatabaseError(`Operation failed after ${maxRetries + 1} attempts`, lastError);
};

// ============================================
// Connection Pool Management
// ============================================

/**
 * Check database connection health
 * @returns {Promise<boolean>} True if connection is healthy
 */
export const checkConnection = async () => {
  try {
    await connection.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('[DB Connection] Health check failed:', error.message);
    return false;
  }
};

/**
 * Get connection information
 * @returns {Object} Connection details
 */
export const getConnectionInfo = () => {
  return {
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.user,
    // Note: Using pg Client instead of Pool, so no pool stats available
    connectionType: 'Client (Single Connection)',
  };
};

/**
 * Gracefully close database connection
 * @returns {Promise<void>}
 */
export const closeConnection = async () => {
  try {
    await connection.end();
    console.log('[DB Connection] Database connection closed');
  } catch (error) {
    console.error('[DB Connection] Error closing connection:', error.message);
    throw error;
  }
};

/**
 * Get database version
 * @returns {Promise<string>} PostgreSQL version
 */
export const getDatabaseVersion = async () => {
  const result = await queryValue('SELECT version()');
  return result;
};

/**
 * Get current timestamp from database
 * @returns {Promise<Date>} Current database timestamp
 */
export const getDatabaseTime = async () => {
  const result = await queryValue('SELECT NOW()');
  return result;
};

// ============================================
// Query Logging Utilities
// ============================================

/**
 * Enable query logging globally (for development)
 */
export const enableQueryLogging = () => {
  console.log('[DB] Query logging enabled');
  // Store original query method
  const originalQuery = connection.query.bind(connection);

  // Override query method with logging
  connection.query = async function(...args) {
    const startTime = Date.now();
    console.log('[DB Query]:', args[0]);
    if (args[1]) console.log('[DB Params]:', args[1]);

    try {
      const result = await originalQuery(...args);
      const duration = Date.now() - startTime;
      console.log(`[DB Query] Completed in ${duration}ms, returned ${result.rowCount} rows`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[DB Error] Query failed after ${duration}ms:`, error.message);
      throw error;
    }
  };
};

/**
 * Get query statistics (basic implementation)
 */
let queryStats = {
  totalQueries: 0,
  successfulQueries: 0,
  failedQueries: 0,
  totalDuration: 0,
};

export const getQueryStats = () => ({ ...queryStats });

export const resetQueryStats = () => {
  queryStats = {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    totalDuration: 0,
  };
};
