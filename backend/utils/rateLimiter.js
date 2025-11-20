/**
 * Rate Limiting Utilities
 * 
 * Implements rate limiting strategies for API calls including:
 * - Exponential backoff retry
 * - Request queuing
 * - Rate limit tracking
 */

/**
 * Sleep utility
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * API call with exponential backoff retry
 * 
 * @param {Function} apiCall - Async function that makes the API call
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 30000)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried
 * @returns {Promise} - Result of API call
 */
export async function apiCallWithRetry(apiCall, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = (error) => {
      // Retry on 429 (rate limit) or 5xx errors
      const status = error.response?.status || error.status;
      return status === 429 || (status >= 500 && status < 600);
    }
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (!shouldRetry(error) || attempt >= maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1),
        maxDelay
      );

      // Check for Retry-After header
      const retryAfter = error.response?.headers['retry-after'];
      const finalDelay = retryAfter ? parseInt(retryAfter) * 1000 : delay;

      console.warn(
        `API call failed (attempt ${attempt}/${maxRetries}), retrying in ${finalDelay}ms...`,
        error.message
      );

      await sleep(finalDelay);
    }
  }

  throw lastError;
}

/**
 * Rate Limiter class for tracking and enforcing rate limits
 */
export class RateLimiter {
  constructor(requestsPerWindow, windowMs) {
    this.requestsPerWindow = requestsPerWindow;
    this.windowMs = windowMs;
    this.requests = [];
  }

  /**
   * Check if a request can be made now
   */
  canMakeRequest() {
    const now = Date.now();
    // Remove requests outside the window
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    return this.requests.length < this.requestsPerWindow;
  }

  /**
   * Record a request
   */
  recordRequest() {
    this.requests.push(Date.now());
  }

  /**
   * Get time until next request can be made
   */
  getTimeUntilNextRequest() {
    if (this.canMakeRequest()) {
      return 0;
    }

    const oldestRequest = Math.min(...this.requests);
    const windowEnd = oldestRequest + this.windowMs;
    return Math.max(0, windowEnd - Date.now());
  }

  /**
   * Wait until a request can be made
   */
  async waitUntilCanRequest() {
    while (!this.canMakeRequest()) {
      const waitTime = this.getTimeUntilNextRequest();
      if (waitTime > 0) {
        await sleep(waitTime);
      }
    }
  }

  /**
   * Make a request with rate limiting
   */
  async makeRequest(apiCall) {
    await this.waitUntilCanRequest();
    this.recordRequest();
    return await apiCall();
  }
}

/**
 * Create rate limiter instances for common APIs
 */
export const rateLimiters = {
  npm: new RateLimiter(100, 60000), // 100 requests per minute
  nvd: new RateLimiter(5, 30000), // 5 requests per 30 seconds
  github: new RateLimiter(5000, 3600000), // 5000 requests per hour
  osv: new RateLimiter(1000, 60000), // 1000 requests per minute
  ossIndex: new RateLimiter(100, 60000) // 100 requests per minute
};

/**
 * Request queue for managing API calls with rate limiting
 */
export class RequestQueue {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
    this.queue = [];
    this.processing = false;
  }

  /**
   * Add request to queue
   */
  async enqueue(apiCall, priority = 'normal') {
    return new Promise((resolve, reject) => {
      this.queue.push({
        apiCall,
        priority,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Sort by priority (high > normal > low)
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      this.queue.sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queue
   */
  async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const { apiCall, resolve, reject } = this.queue.shift();

      try {
        const result = await this.rateLimiter.makeRequest(apiCall);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * Get queue length
   */
  getLength() {
    return this.queue.length;
  }
}

export default {
  sleep,
  apiCallWithRetry,
  RateLimiter,
  rateLimiters,
  RequestQueue
};

