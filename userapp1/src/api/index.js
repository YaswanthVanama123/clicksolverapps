/**
 * API Services Index
 * Central export point for all API services
 */

// Import all services
import authService from './services/auth.service';
import bookingService from './services/booking.service';
import workerService from './services/worker.service';
import userService from './services/user.service';

// Export axios client and endpoints
export {default as apiClient} from './client';
export {default as API_ENDPOINTS} from './endpoints';

// Export individual services
export {authService, bookingService, workerService, userService};

// Export all services as a single object
export default {
  auth: authService,
  booking: bookingService,
  worker: workerService,
  user: userService,
};
