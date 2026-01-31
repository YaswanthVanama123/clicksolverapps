/**
 * Query Testing Utilities
 * Provides mock database connections, validation functions, and test helpers
 * for testing database queries
 */

const { Pool } = require('pg');

/**
 * Mock Database Connection
 * Creates a mock PostgreSQL pool for testing
 */
class MockDatabaseConnection {
  constructor() {
    this.queries = [];
    this.mockResults = new Map();
    this.mockErrors = new Map();
    this.transactionDepth = 0;
    this.inTransaction = false;
  }

  /**
   * Mock query execution
   */
  async query(text, params = []) {
    this.queries.push({ text, params, timestamp: new Date() });

    // Check if there's a mock error set for this query
    const errorKey = this._generateQueryKey(text, params);
    if (this.mockErrors.has(errorKey)) {
      throw this.mockErrors.get(errorKey);
    }

    // Check if there's a mock result set for this query
    if (this.mockResults.has(errorKey)) {
      return this.mockResults.get(errorKey);
    }

    // Default mock result
    return {
      rows: [],
      rowCount: 0,
      command: this._extractCommand(text),
      fields: []
    };
  }

  /**
   * Mock connect for transaction support
   */
  async connect() {
    return {
      query: this.query.bind(this),
      release: () => {},
      client: this
    };
  }

  /**
   * Set mock result for a specific query
   */
  setMockResult(text, params, result) {
    const key = this._generateQueryKey(text, params);
    this.mockResults.set(key, result);
  }

  /**
   * Set mock error for a specific query
   */
  setMockError(text, params, error) {
    const key = this._generateQueryKey(text, params);
    this.mockErrors.set(key, error);
  }

  /**
   * Get all executed queries
   */
  getExecutedQueries() {
    return this.queries;
  }

  /**
   * Get last executed query
   */
  getLastQuery() {
    return this.queries[this.queries.length - 1];
  }

  /**
   * Clear all queries and mocks
   */
  reset() {
    this.queries = [];
    this.mockResults.clear();
    this.mockErrors.clear();
    this.transactionDepth = 0;
    this.inTransaction = false;
  }

  /**
   * Check if a specific query was executed
   */
  wasQueryExecuted(text) {
    return this.queries.some(q => q.text.includes(text));
  }

  /**
   * Get queries matching a pattern
   */
  getQueriesMatching(pattern) {
    return this.queries.filter(q => {
      if (typeof pattern === 'string') {
        return q.text.includes(pattern);
      }
      return pattern.test(q.text);
    });
  }

  /**
   * Generate a unique key for query/params combination
   */
  _generateQueryKey(text, params) {
    return `${text}||${JSON.stringify(params)}`;
  }

  /**
   * Extract SQL command from query text
   */
  _extractCommand(text) {
    const match = text.trim().match(/^(\w+)/i);
    return match ? match[1].toUpperCase() : 'UNKNOWN';
  }
}

/**
 * Query Validation Functions
 */
const QueryValidators = {
  /**
   * Validate SQL syntax (basic checks)
   */
  validateSQLSyntax(query) {
    const errors = [];

    // Check for empty query
    if (!query || query.trim().length === 0) {
      errors.push('Query cannot be empty');
    }

    // Check for balanced parentheses
    const openParens = (query.match(/\(/g) || []).length;
    const closeParens = (query.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push('Unbalanced parentheses in query');
    }

    // Check for SQL injection patterns
    const dangerousPatterns = [
      /;\s*DROP/i,
      /;\s*DELETE\s+FROM/i,
      /;\s*TRUNCATE/i,
      /--.*$/m,
      /\/\*.*\*\//
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(query)) {
        errors.push(`Potentially dangerous pattern detected: ${pattern}`);
      }
    });

    // Check for basic SQL structure
    const validCommands = /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|BEGIN|COMMIT|ROLLBACK)/i;
    if (!validCommands.test(query.trim())) {
      errors.push('Query must start with a valid SQL command');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate parameterized query
   */
  validateParameterizedQuery(query, params = []) {
    const errors = [];

    // Count parameter placeholders
    const placeholders = query.match(/\$\d+/g) || [];
    const maxPlaceholder = Math.max(
      0,
      ...placeholders.map(p => parseInt(p.substring(1)))
    );

    // Check if params array matches placeholders
    if (maxPlaceholder !== params.length) {
      errors.push(
        `Parameter count mismatch: query expects ${maxPlaceholder} parameters but received ${params.length}`
      );
    }

    // Check for sequential placeholders
    const placeholderNumbers = placeholders.map(p => parseInt(p.substring(1)));
    const uniqueNumbers = [...new Set(placeholderNumbers)].sort((a, b) => a - b);

    for (let i = 0; i < uniqueNumbers.length; i++) {
      if (uniqueNumbers[i] !== i + 1) {
        errors.push(`Non-sequential placeholder numbers detected. Expected $${i + 1}, found $${uniqueNumbers[i]}`);
        break;
      }
    }

    // Validate parameter types
    params.forEach((param, index) => {
      if (param === undefined) {
        errors.push(`Parameter $${index + 1} is undefined`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      placeholderCount: maxPlaceholder
    };
  },

  /**
   * Validate SELECT query structure
   */
  validateSelectQuery(query) {
    const errors = [];

    if (!/^SELECT/i.test(query.trim())) {
      errors.push('Not a SELECT query');
      return { valid: false, errors };
    }

    // Check for SELECT and FROM clauses
    if (!/SELECT\s+.+\s+FROM/i.test(query)) {
      errors.push('SELECT query must have both SELECT and FROM clauses');
    }

    // Check for SELECT *
    if (/SELECT\s+\*/i.test(query)) {
      errors.push('Warning: SELECT * should be avoided in production code');
    }

    return {
      valid: errors.filter(e => !e.startsWith('Warning:')).length === 0,
      errors
    };
  },

  /**
   * Validate INSERT query structure
   */
  validateInsertQuery(query) {
    const errors = [];

    if (!/^INSERT/i.test(query.trim())) {
      errors.push('Not an INSERT query');
      return { valid: false, errors };
    }

    // Check for INSERT INTO
    if (!/INSERT\s+INTO/i.test(query)) {
      errors.push('INSERT query must use INSERT INTO syntax');
    }

    // Check for VALUES or SELECT
    if (!/VALUES\s*\(|SELECT/i.test(query)) {
      errors.push('INSERT query must have VALUES clause or SELECT statement');
    }

    // Check for balanced parentheses in VALUES
    const valuesMatch = query.match(/VALUES\s*(\(.*\))/i);
    if (valuesMatch) {
      const values = valuesMatch[1];
      const openParens = (values.match(/\(/g) || []).length;
      const closeParens = (values.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push('Unbalanced parentheses in VALUES clause');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate UPDATE query structure
   */
  validateUpdateQuery(query) {
    const errors = [];

    if (!/^UPDATE/i.test(query.trim())) {
      errors.push('Not an UPDATE query');
      return { valid: false, errors };
    }

    // Check for SET clause
    if (!/SET\s+/i.test(query)) {
      errors.push('UPDATE query must have SET clause');
    }

    // Warn if no WHERE clause (potential mass update)
    if (!/WHERE\s+/i.test(query)) {
      errors.push('Warning: UPDATE query without WHERE clause will affect all rows');
    }

    return {
      valid: errors.filter(e => !e.startsWith('Warning:')).length === 0,
      errors
    };
  },

  /**
   * Validate DELETE query structure
   */
  validateDeleteQuery(query) {
    const errors = [];

    if (!/^DELETE/i.test(query.trim())) {
      errors.push('Not a DELETE query');
      return { valid: false, errors };
    }

    // Check for FROM clause
    if (!/DELETE\s+FROM/i.test(query)) {
      errors.push('DELETE query must use DELETE FROM syntax');
    }

    // Warn if no WHERE clause (potential mass delete)
    if (!/WHERE\s+/i.test(query)) {
      errors.push('Warning: DELETE query without WHERE clause will delete all rows');
    }

    return {
      valid: errors.filter(e => !e.startsWith('Warning:')).length === 0,
      errors
    };
  }
};

/**
 * Parameter Testing Helpers
 */
const ParameterHelpers = {
  /**
   * Generate test parameters of various types
   */
  generateTestParams(types) {
    const generators = {
      string: () => 'test_string',
      number: () => 42,
      boolean: () => true,
      date: () => new Date('2024-01-01'),
      null: () => null,
      array: () => [1, 2, 3],
      object: () => ({ key: 'value' }),
      uuid: () => '550e8400-e29b-41d4-a716-446655440000',
      email: () => 'test@example.com',
      phone: () => '+1234567890',
      url: () => 'https://example.com'
    };

    return types.map(type => {
      const generator = generators[type];
      if (!generator) {
        throw new Error(`Unknown parameter type: ${type}`);
      }
      return generator();
    });
  },

  /**
   * Create parameter variations for edge case testing
   */
  generateParameterVariations(baseParam) {
    const variations = {
      empty: '',
      null: null,
      undefined: undefined,
      whitespace: '   ',
      long: 'x'.repeat(1000),
      special_chars: '!@#$%^&*()[]{}|\\;:\'",<.>/?',
      sql_injection: "'; DROP TABLE users; --",
      unicode: '𝕳𝖊𝖑𝖑𝖔 🌍',
      numeric_string: '12345',
      zero: 0,
      negative: -1,
      large_number: Number.MAX_SAFE_INTEGER
    };

    return variations;
  },

  /**
   * Validate parameter types
   */
  validateParamTypes(params, expectedTypes) {
    const errors = [];

    params.forEach((param, index) => {
      const expectedType = expectedTypes[index];
      const actualType = typeof param;

      if (expectedType === 'date' && !(param instanceof Date)) {
        errors.push(`Parameter ${index + 1}: expected Date, got ${actualType}`);
      } else if (expectedType === 'array' && !Array.isArray(param)) {
        errors.push(`Parameter ${index + 1}: expected Array, got ${actualType}`);
      } else if (expectedType !== 'date' && expectedType !== 'array' && actualType !== expectedType) {
        errors.push(`Parameter ${index + 1}: expected ${expectedType}, got ${actualType}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Sanitize parameters for SQL injection testing
   */
  sanitizeParams(params) {
    return params.map(param => {
      if (typeof param === 'string') {
        return param.replace(/['";\\]/g, '');
      }
      return param;
    });
  }
};

/**
 * Common Test Fixtures
 */
const TestFixtures = {
  /**
   * Sample user data
   */
  users: [
    {
      id: 1,
      email: 'user1@example.com',
      name: 'User One',
      role: 'admin',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 2,
      email: 'user2@example.com',
      name: 'User Two',
      role: 'user',
      created_at: new Date('2024-01-02'),
      updated_at: new Date('2024-01-02')
    },
    {
      id: 3,
      email: 'user3@example.com',
      name: 'User Three',
      role: 'user',
      created_at: new Date('2024-01-03'),
      updated_at: new Date('2024-01-03')
    }
  ],

  /**
   * Sample order data
   */
  orders: [
    {
      id: 1,
      user_id: 1,
      status: 'pending',
      total: 100.00,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 2,
      user_id: 1,
      status: 'completed',
      total: 250.50,
      created_at: new Date('2024-01-02'),
      updated_at: new Date('2024-01-03')
    },
    {
      id: 3,
      user_id: 2,
      status: 'pending',
      total: 75.25,
      created_at: new Date('2024-01-03'),
      updated_at: new Date('2024-01-03')
    }
  ],

  /**
   * Sample product data
   */
  products: [
    {
      id: 1,
      name: 'Product One',
      description: 'Description for product one',
      price: 50.00,
      stock: 100,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 2,
      name: 'Product Two',
      description: 'Description for product two',
      price: 75.50,
      stock: 50,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    }
  ],

  /**
   * Generate mock query result
   */
  createMockResult(rows, command = 'SELECT') {
    return {
      rows,
      rowCount: rows.length,
      command,
      fields: rows.length > 0 ? Object.keys(rows[0]).map(name => ({ name })) : []
    };
  },

  /**
   * Generate mock error
   */
  createMockError(code, message, detail = null) {
    const error = new Error(message);
    error.code = code;
    if (detail) {
      error.detail = detail;
    }
    return error;
  },

  /**
   * Common database errors
   */
  errors: {
    uniqueViolation: (field) => ({
      code: '23505',
      message: `duplicate key value violates unique constraint`,
      detail: `Key (${field})=(...) already exists.`
    }),
    foreignKeyViolation: (table) => ({
      code: '23503',
      message: `insert or update on table "${table}" violates foreign key constraint`,
      detail: 'Key is not present in referenced table.'
    }),
    notNullViolation: (column) => ({
      code: '23502',
      message: `null value in column "${column}" violates not-null constraint`
    }),
    checkViolation: (constraint) => ({
      code: '23514',
      message: `new row for relation violates check constraint "${constraint}"`
    }),
    connectionError: () => ({
      code: 'ECONNREFUSED',
      message: 'Connection refused'
    }),
    syntaxError: () => ({
      code: '42601',
      message: 'syntax error at or near'
    }),
    undefinedTable: (table) => ({
      code: '42P01',
      message: `relation "${table}" does not exist`
    }),
    undefinedColumn: (column) => ({
      code: '42703',
      message: `column "${column}" does not exist`
    })
  }
};

/**
 * SQL Syntax Validation Helpers
 */
const SQLValidation = {
  /**
   * Extract table names from query
   */
  extractTableNames(query) {
    const tables = [];

    // Match FROM clause
    const fromMatch = query.match(/FROM\s+([a-z_][a-z0-9_]*)/gi);
    if (fromMatch) {
      fromMatch.forEach(match => {
        const table = match.replace(/FROM\s+/i, '').trim();
        tables.push(table);
      });
    }

    // Match JOIN clauses
    const joinMatch = query.match(/JOIN\s+([a-z_][a-z0-9_]*)/gi);
    if (joinMatch) {
      joinMatch.forEach(match => {
        const table = match.replace(/JOIN\s+/i, '').trim();
        tables.push(table);
      });
    }

    // Match INSERT INTO
    const insertMatch = query.match(/INSERT\s+INTO\s+([a-z_][a-z0-9_]*)/i);
    if (insertMatch) {
      tables.push(insertMatch[1]);
    }

    // Match UPDATE
    const updateMatch = query.match(/UPDATE\s+([a-z_][a-z0-9_]*)/i);
    if (updateMatch) {
      tables.push(updateMatch[1]);
    }

    return [...new Set(tables)];
  },

  /**
   * Extract column names from query
   */
  extractColumnNames(query) {
    const columns = [];

    // Match SELECT columns
    const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM/is);
    if (selectMatch) {
      const columnsPart = selectMatch[1];
      if (!columnsPart.includes('*')) {
        const cols = columnsPart.split(',').map(c => c.trim().split(/\s+/)[0]);
        columns.push(...cols);
      }
    }

    // Match WHERE conditions
    const whereMatch = query.match(/WHERE\s+(.+?)(\s+ORDER|\s+GROUP|\s+LIMIT|$)/is);
    if (whereMatch) {
      const conditions = whereMatch[1];
      const columnMatches = conditions.match(/[a-z_][a-z0-9_]*/gi);
      if (columnMatches) {
        columns.push(...columnMatches);
      }
    }

    return [...new Set(columns)];
  },

  /**
   * Check if query uses prepared statements
   */
  usesPreparedStatements(query) {
    return /\$\d+/.test(query);
  },

  /**
   * Check if query has WHERE clause
   */
  hasWhereClause(query) {
    return /WHERE\s+/i.test(query);
  },

  /**
   * Check if query has ORDER BY clause
   */
  hasOrderByClause(query) {
    return /ORDER\s+BY\s+/i.test(query);
  },

  /**
   * Check if query has LIMIT clause
   */
  hasLimitClause(query) {
    return /LIMIT\s+\d+/i.test(query);
  },

  /**
   * Check if query uses transactions
   */
  isTransactionQuery(query) {
    return /^(BEGIN|COMMIT|ROLLBACK)/i.test(query.trim());
  },

  /**
   * Validate query performance considerations
   */
  validatePerformance(query) {
    const warnings = [];

    // Check for SELECT *
    if (/SELECT\s+\*/i.test(query)) {
      warnings.push('Using SELECT * can impact performance. Select specific columns.');
    }

    // Check for missing WHERE in UPDATE/DELETE
    if (/(UPDATE|DELETE)/i.test(query) && !/WHERE/i.test(query)) {
      warnings.push('UPDATE/DELETE without WHERE clause can affect all rows.');
    }

    // Check for subqueries
    if ((query.match(/SELECT/gi) || []).length > 1) {
      warnings.push('Query contains subqueries. Consider if JOIN would be more efficient.');
    }

    // Check for OR conditions (potential index issues)
    if (/\s+OR\s+/i.test(query)) {
      warnings.push('OR conditions can prevent index usage. Consider UNION or IN clause.');
    }

    // Check for LIKE with leading wildcard
    if (/LIKE\s+['"]%/i.test(query)) {
      warnings.push('LIKE with leading wildcard prevents index usage.');
    }

    return warnings;
  }
};

/**
 * Test Helper Functions
 */
const TestHelpers = {
  /**
   * Create a test database connection
   */
  createTestConnection() {
    return new MockDatabaseConnection();
  },

  /**
   * Run query test suite
   */
  async runQueryTest(connection, query, params, expectedResult) {
    const result = await connection.query(query, params);

    return {
      success: JSON.stringify(result) === JSON.stringify(expectedResult),
      result,
      expected: expectedResult,
      query,
      params
    };
  },

  /**
   * Assert query was executed
   */
  assertQueryExecuted(connection, queryPattern) {
    const wasExecuted = connection.wasQueryExecuted(queryPattern);
    if (!wasExecuted) {
      throw new Error(`Expected query containing "${queryPattern}" was not executed`);
    }
    return true;
  },

  /**
   * Assert query result matches expected
   */
  assertResultMatches(actual, expected) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);

    if (actualStr !== expectedStr) {
      throw new Error(`Result mismatch:\nExpected: ${expectedStr}\nActual: ${actualStr}`);
    }
    return true;
  },

  /**
   * Measure query execution time
   */
  async measureQueryTime(connection, query, params) {
    const start = Date.now();
    await connection.query(query, params);
    const end = Date.now();
    return end - start;
  }
};

module.exports = {
  MockDatabaseConnection,
  QueryValidators,
  ParameterHelpers,
  TestFixtures,
  SQLValidation,
  TestHelpers
};
