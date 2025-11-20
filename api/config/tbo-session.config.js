/**
 * TBO Session Configuration
 * 
 * Manages session TTL, bargain settings, and price hold windows
 * Based on TBO API specifications and real-world testing
 */

module.exports = {
  /**
   * TBO Session Settings
   * 
   * TraceId validity window - exact duration not documented in TBO specs
   * Based on industry standards for hotel search sessions (~10-15 minutes)
   * 
   * Configurable via environment variable TBO_SESSION_TTL_MINUTES
   */
  SESSION_TTL_MINUTES: parseInt(process.env.TBO_SESSION_TTL_MINUTES || "10", 10),

  /**
   * Safety buffer before session expiry
   * Prevents booking attempts too close to expiry
   * 
   * Example: If session expires at 12:10:00
   * We stop accepting booking requests at 12:09:00 (1 min safety buffer)
   */
  SESSION_SAFETY_BUFFER_SECONDS: parseInt(
    process.env.SESSION_SAFETY_BUFFER_SECONDS || "60",
    10,
  ),

  /**
   * Token validity
   * TBO TokenId is valid for 24 hours per API documentation
   */
  TOKEN_TTL_HOURS: 24,

  /**
   * Bargain Engine Settings
   */
  BARGAIN: {
    /**
     * Maximum bargain attempts per room
     * User gets 2 rounds to negotiate before final price
     */
    MAX_ATTEMPTS: parseInt(process.env.BARGAIN_ATTEMPTS_MAX || "2", 10),

    /**
     * Timer per bargain round (seconds)
     * User must submit counteroffer within this window
     */
    ROUND_TIMER_SECONDS: parseInt(
      process.env.BARGAIN_ROUND_TIMER_SECONDS || "30",
      10,
    ),

    /**
     * Total bargain window (seconds)
     * Maximum time from first attempt to final booking
     * Should be less than SESSION_TTL_MINUTES
     */
    TOTAL_WINDOW_SECONDS: parseInt(
      process.env.BARGAIN_TOTAL_WINDOW_SECONDS || "300",
      10,
    ), // 5 minutes
  },

  /**
   * Cache Settings
   */
  CACHE: {
    /**
     * How long to cache search results (hours)
     * Should be less than SESSION_TTL to avoid stale prices
     */
    SEARCH_RESULT_TTL_HOURS: parseInt(
      process.env.CACHE_SEARCH_TTL_HOURS || "4",
      10,
    ),

    /**
     * How long to cache static data (city lists, etc) in hours
     */
    STATIC_DATA_TTL_HOURS: parseInt(
      process.env.CACHE_STATIC_DATA_TTL_HOURS || "168",
      10,
    ), // 7 days
  },

  /**
   * Calculate session expiry timestamp
   * @param {Date} startTime - When the session started
   * @returns {Date} - When the session expires
   */
  calculateSessionExpiry(startTime = new Date()) {
    const expiryTime = new Date(startTime);
    expiryTime.setMinutes(
      expiryTime.getMinutes() + this.SESSION_TTL_MINUTES,
    );
    return expiryTime;
  },

  /**
   * Calculate effective booking deadline (with safety buffer)
   * @param {Date} sessionExpiry - When the session expires
   * @returns {Date} - Last safe time to attempt booking
   */
  calculateBookingDeadline(sessionExpiry) {
    const deadline = new Date(sessionExpiry);
    deadline.setSeconds(
      deadline.getSeconds() - this.SESSION_SAFETY_BUFFER_SECONDS,
    );
    return deadline;
  },

  /**
   * Check if session is still valid for booking
   * @param {Date} sessionExpiry - When the session expires
   * @returns {boolean} - True if safe to book
   */
  isSessionValid(sessionExpiry) {
    const now = new Date();
    const deadline = this.calculateBookingDeadline(sessionExpiry);
    return now < deadline;
  },

  /**
   * Get remaining session time in seconds
   * @param {Date} sessionExpiry - When the session expires
   * @returns {number} - Seconds remaining (0 if expired)
   */
  getSessionTimeRemaining(sessionExpiry) {
    const now = new Date();
    const deadline = this.calculateBookingDeadline(sessionExpiry);
    const remainingMs = deadline.getTime() - now.getTime();
    return Math.max(0, Math.floor(remainingMs / 1000));
  },
};
