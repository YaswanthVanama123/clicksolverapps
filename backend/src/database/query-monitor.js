const logger = require('../utils/logger');

/**
 * Query Performance Monitor
 * Tracks query execution time, detects slow queries, analyzes frequency, and provides recommendations
 */
class QueryMonitor {
  constructor(options = {}) {
    this.slowQueryThreshold = options.slowQueryThreshold || 1000; // ms
    this.enableLogging = options.enableLogging !== false;
    this.enableRecommendations = options.enableRecommendations !== false;
    this.maxStoredQueries = options.maxStoredQueries || 1000;

    // Query statistics storage
    this.queryStats = new Map();
    this.queryHistory = [];
    this.slowQueries = [];

    // Performance metrics
    this.metrics = {
      totalQueries: 0,
      totalExecutionTime: 0,
      slowQueryCount: 0,
      averageExecutionTime: 0,
      queryTypeDistribution: {},
    };
  }

  /**
   * Start monitoring a query
   * @param {string} query - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Object} Query tracker object
   */
  startQuery(query, params = []) {
    const queryId = this._generateQueryId();
    const normalizedQuery = this._normalizeQuery(query);

    return {
      queryId,
      query,
      normalizedQuery,
      params,
      startTime: Date.now(),
      startMemory: process.memoryUsage().heapUsed,
    };
  }

  /**
   * End monitoring a query and record statistics
   * @param {Object} tracker - Query tracker from startQuery
   * @param {Object} result - Query result
   * @param {Error} error - Error if query failed
   */
  endQuery(tracker, result = null, error = null) {
    const endTime = Date.now();
    const executionTime = endTime - tracker.startTime;
    const endMemory = process.memoryUsage().heapUsed;
    const memoryDelta = endMemory - tracker.startMemory;

    const queryRecord = {
      queryId: tracker.queryId,
      query: tracker.query,
      normalizedQuery: tracker.normalizedQuery,
      params: tracker.params,
      executionTime,
      memoryDelta,
      timestamp: new Date().toISOString(),
      success: !error,
      error: error ? error.message : null,
      rowCount: result ? (result.rowCount || result.length || 0) : 0,
      queryType: this._detectQueryType(tracker.query),
    };

    // Update statistics
    this._updateStatistics(queryRecord);

    // Check for slow query
    if (executionTime > this.slowQueryThreshold) {
      this._handleSlowQuery(queryRecord);
    }

    // Store query history
    this._storeQueryHistory(queryRecord);

    // Log query if enabled
    if (this.enableLogging) {
      this._logQuery(queryRecord);
    }

    return queryRecord;
  }

  /**
   * Wrap a database query function with monitoring
   * @param {Function} queryFn - Database query function
   * @returns {Function} Wrapped query function
   */
  wrapQuery(queryFn) {
    return async (query, params) => {
      const tracker = this.startQuery(query, params);
      let result = null;
      let error = null;

      try {
        result = await queryFn(query, params);
        return result;
      } catch (err) {
        error = err;
        throw err;
      } finally {
        this.endQuery(tracker, result, error);
      }
    };
  }

  /**
   * Get query statistics for a specific query pattern
   * @param {string} normalizedQuery - Normalized query string
   * @returns {Object} Query statistics
   */
  getQueryStats(normalizedQuery) {
    return this.queryStats.get(normalizedQuery) || null;
  }

  /**
   * Get all query statistics
   * @returns {Object} All statistics
   */
  getAllStats() {
    const stats = {
      ...this.metrics,
      topSlowQueries: this.getTopSlowQueries(10),
      topFrequentQueries: this.getTopFrequentQueries(10),
      queryPatterns: Array.from(this.queryStats.values()),
    };

    if (this.enableRecommendations) {
      stats.recommendations = this.generateRecommendations();
    }

    return stats;
  }

  /**
   * Get top slow queries
   * @param {number} limit - Number of queries to return
   * @returns {Array} Slow queries
   */
  getTopSlowQueries(limit = 10) {
    return [...this.slowQueries]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  /**
   * Get most frequent queries
   * @param {number} limit - Number of queries to return
   * @returns {Array} Frequent queries
   */
  getTopFrequentQueries(limit = 10) {
    return Array.from(this.queryStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(stat => ({
        query: stat.normalizedQuery,
        count: stat.count,
        averageTime: stat.averageTime,
        totalTime: stat.totalTime,
      }));
  }

  /**
   * Generate performance recommendations
   * @returns {Array} Recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Check for N+1 query patterns
    const nPlusOneQueries = this._detectNPlusOneQueries();
    if (nPlusOneQueries.length > 0) {
      recommendations.push({
        type: 'N+1_QUERY',
        severity: 'high',
        message: 'Potential N+1 query pattern detected',
        queries: nPlusOneQueries,
        suggestion: 'Consider using JOIN operations or batch loading to reduce query count',
      });
    }

    // Check for missing indexes
    const selectWithoutIndex = this._detectQueriesWithoutIndex();
    if (selectWithoutIndex.length > 0) {
      recommendations.push({
        type: 'MISSING_INDEX',
        severity: 'medium',
        message: 'Queries may benefit from database indexes',
        queries: selectWithoutIndex,
        suggestion: 'Add indexes on frequently queried columns',
      });
    }

    // Check for SELECT * queries
    const selectAllQueries = this._detectSelectAllQueries();
    if (selectAllQueries.length > 0) {
      recommendations.push({
        type: 'SELECT_ALL',
        severity: 'low',
        message: 'SELECT * queries found',
        queries: selectAllQueries,
        suggestion: 'Specify only required columns to reduce data transfer',
      });
    }

    // Check for queries without WHERE clause
    const queriesWithoutWhere = this._detectQueriesWithoutWhere();
    if (queriesWithoutWhere.length > 0) {
      recommendations.push({
        type: 'NO_WHERE_CLAUSE',
        severity: 'medium',
        message: 'Queries without WHERE clause detected',
        queries: queriesWithoutWhere,
        suggestion: 'Add WHERE clauses to limit data retrieval or ensure proper indexing',
      });
    }

    // Check for slow aggregate queries
    const slowAggregates = this._detectSlowAggregateQueries();
    if (slowAggregates.length > 0) {
      recommendations.push({
        type: 'SLOW_AGGREGATE',
        severity: 'high',
        message: 'Slow aggregate queries detected',
        queries: slowAggregates,
        suggestion: 'Consider materialized views, caching, or query optimization',
      });
    }

    return recommendations;
  }

  /**
   * Reset all statistics
   */
  reset() {
    this.queryStats.clear();
    this.queryHistory = [];
    this.slowQueries = [];
    this.metrics = {
      totalQueries: 0,
      totalExecutionTime: 0,
      slowQueryCount: 0,
      averageExecutionTime: 0,
      queryTypeDistribution: {},
    };
  }

  /**
   * Export statistics to JSON
   * @returns {string} JSON string of statistics
   */
  exportStats() {
    return JSON.stringify(this.getAllStats(), null, 2);
  }

  // Private methods

  _generateQueryId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  _normalizeQuery(query) {
    return query
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\$\d+/g, '?') // Replace PostgreSQL parameters
      .replace(/\?/g, '?') // Normalize parameters
      .replace(/'\w+'/g, '?') // Replace string literals
      .replace(/\b\d+\b/g, '?') // Replace numeric literals
      .trim()
      .toLowerCase();
  }

  _detectQueryType(query) {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.startsWith('select')) return 'SELECT';
    if (normalizedQuery.startsWith('insert')) return 'INSERT';
    if (normalizedQuery.startsWith('update')) return 'UPDATE';
    if (normalizedQuery.startsWith('delete')) return 'DELETE';
    if (normalizedQuery.startsWith('create')) return 'CREATE';
    if (normalizedQuery.startsWith('alter')) return 'ALTER';
    if (normalizedQuery.startsWith('drop')) return 'DROP';

    return 'OTHER';
  }

  _updateStatistics(queryRecord) {
    const { normalizedQuery, executionTime, queryType, success } = queryRecord;

    // Update global metrics
    this.metrics.totalQueries++;
    this.metrics.totalExecutionTime += executionTime;
    this.metrics.averageExecutionTime =
      this.metrics.totalExecutionTime / this.metrics.totalQueries;

    // Update query type distribution
    this.metrics.queryTypeDistribution[queryType] =
      (this.metrics.queryTypeDistribution[queryType] || 0) + 1;

    // Update per-query statistics
    if (!this.queryStats.has(normalizedQuery)) {
      this.queryStats.set(normalizedQuery, {
        normalizedQuery,
        count: 0,
        totalTime: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0,
        successCount: 0,
        errorCount: 0,
        queryType,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      });
    }

    const stats = this.queryStats.get(normalizedQuery);
    stats.count++;
    stats.totalTime += executionTime;
    stats.averageTime = stats.totalTime / stats.count;
    stats.minTime = Math.min(stats.minTime, executionTime);
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.lastSeen = new Date().toISOString();

    if (success) {
      stats.successCount++;
    } else {
      stats.errorCount++;
    }
  }

  _handleSlowQuery(queryRecord) {
    this.metrics.slowQueryCount++;
    this.slowQueries.push(queryRecord);

    // Keep only recent slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift();
    }

    if (this.enableLogging) {
      logger.warn('Slow query detected', {
        query: queryRecord.query,
        executionTime: queryRecord.executionTime,
        threshold: this.slowQueryThreshold,
      });
    }
  }

  _storeQueryHistory(queryRecord) {
    this.queryHistory.push(queryRecord);

    // Keep history within limits
    if (this.queryHistory.length > this.maxStoredQueries) {
      this.queryHistory.shift();
    }
  }

  _logQuery(queryRecord) {
    const logLevel = queryRecord.success ? 'debug' : 'error';
    const logData = {
      queryId: queryRecord.queryId,
      queryType: queryRecord.queryType,
      executionTime: queryRecord.executionTime,
      rowCount: queryRecord.rowCount,
      memoryDelta: queryRecord.memoryDelta,
    };

    if (queryRecord.error) {
      logData.error = queryRecord.error;
    }

    logger[logLevel](`Query ${queryRecord.queryType}`, logData);
  }

  _detectNPlusOneQueries() {
    const recentQueries = this.queryHistory.slice(-100);
    const nPlusOnePatterns = [];
    const timeWindow = 1000; // 1 second window

    for (let i = 0; i < recentQueries.length - 1; i++) {
      const current = recentQueries[i];
      const similar = recentQueries
        .slice(i + 1, i + 20)
        .filter(q =>
          q.normalizedQuery === current.normalizedQuery &&
          Math.abs(new Date(q.timestamp) - new Date(current.timestamp)) < timeWindow
        );

      if (similar.length > 5) {
        nPlusOnePatterns.push({
          query: current.normalizedQuery,
          occurrences: similar.length + 1,
          timeWindow,
        });
      }
    }

    return nPlusOnePatterns;
  }

  _detectQueriesWithoutIndex() {
    // Detect queries that might benefit from indexes
    // This is a heuristic based on query patterns
    const candidates = [];

    for (const [query, stats] of this.queryStats) {
      if (
        stats.queryType === 'SELECT' &&
        stats.averageTime > this.slowQueryThreshold / 2 &&
        stats.count > 10 &&
        (query.includes('where') || query.includes('join'))
      ) {
        candidates.push({
          query,
          averageTime: stats.averageTime,
          count: stats.count,
        });
      }
    }

    return candidates;
  }

  _detectSelectAllQueries() {
    const selectAllQueries = [];

    for (const [query, stats] of this.queryStats) {
      if (
        stats.queryType === 'SELECT' &&
        (query.includes('select *') || query.includes('select*'))
      ) {
        selectAllQueries.push({
          query,
          count: stats.count,
          averageTime: stats.averageTime,
        });
      }
    }

    return selectAllQueries;
  }

  _detectQueriesWithoutWhere() {
    const queriesWithoutWhere = [];

    for (const [query, stats] of this.queryStats) {
      if (
        ['SELECT', 'UPDATE', 'DELETE'].includes(stats.queryType) &&
        !query.includes('where') &&
        stats.averageTime > 100 // Only flag if taking more than 100ms
      ) {
        queriesWithoutWhere.push({
          query,
          queryType: stats.queryType,
          count: stats.count,
          averageTime: stats.averageTime,
        });
      }
    }

    return queriesWithoutWhere;
  }

  _detectSlowAggregateQueries() {
    const slowAggregates = [];

    for (const [query, stats] of this.queryStats) {
      if (
        stats.queryType === 'SELECT' &&
        (query.includes('count(') ||
         query.includes('sum(') ||
         query.includes('avg(') ||
         query.includes('group by')) &&
        stats.averageTime > this.slowQueryThreshold
      ) {
        slowAggregates.push({
          query,
          averageTime: stats.averageTime,
          count: stats.count,
        });
      }
    }

    return slowAggregates;
  }
}

// Singleton instance
let monitorInstance = null;

/**
 * Initialize the query monitor
 * @param {Object} options - Configuration options
 * @returns {QueryMonitor} Monitor instance
 */
function initializeMonitor(options = {}) {
  if (!monitorInstance) {
    monitorInstance = new QueryMonitor(options);
  }
  return monitorInstance;
}

/**
 * Get the monitor instance
 * @returns {QueryMonitor} Monitor instance
 */
function getMonitor() {
  if (!monitorInstance) {
    throw new Error('Query monitor not initialized. Call initializeMonitor() first.');
  }
  return monitorInstance;
}

/**
 * Middleware for automatic query monitoring
 * @param {Object} db - Database connection object
 * @returns {Object} Database with wrapped query methods
 */
function createMonitoringMiddleware(db) {
  const monitor = getMonitor();

  return {
    ...db,
    query: monitor.wrapQuery(db.query.bind(db)),
  };
}

module.exports = {
  QueryMonitor,
  initializeMonitor,
  getMonitor,
  createMonitoringMiddleware,
};
