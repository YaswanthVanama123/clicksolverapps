// Primary middleware imports (canonical names)
const { authenticateToken } = require('./auth.middleware');
const { authenticateWorkerToken } = require('./worker-auth.middleware');
const { authAdminMiddleware } = require('./admin-auth.middleware');

module.exports = {
  // Primary exports (canonical names)
  authenticateToken,
  authenticateWorkerToken,
  authAdminMiddleware,

  // Aliases for backward compatibility (shorter names)
  authMiddleware: authenticateToken,
  workerAuthMiddleware: authenticateWorkerToken,
  adminAuthMiddleware: authAdminMiddleware,

  // Additional aliases for convenience
  authenticateUser: authenticateToken,
  authenticateWorker: authenticateWorkerToken,
  authenticateAdmin: authAdminMiddleware,
};
