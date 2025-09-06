/**
 * Journey tracking utilities for Price Echo system
 * Manages journey IDs across the user flow for price consistency tracking
 */

/**
 * Generate a new journey ID
 * @returns {string} New journey ID
 */
export const generateJourneyId = (): string => {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get or create journey ID from localStorage
 * @returns {string} Current journey ID
 */
export const getJourneyId = (): string => {
  try {
    let journeyId = localStorage.getItem('fd_journey_id');
    
    if (!journeyId) {
      journeyId = generateJourneyId();
      localStorage.setItem('fd_journey_id', journeyId);
    }
    
    return journeyId;
  } catch (error) {
    // If localStorage is not available, generate a session-only ID
    console.warn('localStorage not available, using session-only journey ID');
    return generateJourneyId();
  }
};

/**
 * Start a new journey (clear existing journey ID)
 * @returns {string} New journey ID
 */
export const startNewJourney = (): string => {
  try {
    const newJourneyId = generateJourneyId();
    localStorage.setItem('fd_journey_id', newJourneyId);
    return newJourneyId;
  } catch (error) {
    console.warn('localStorage not available for new journey');
    return generateJourneyId();
  }
};

/**
 * Clear journey ID (end journey)
 */
export const endJourney = (): void => {
  try {
    localStorage.removeItem('fd_journey_id');
  } catch (error) {
    console.warn('localStorage not available for ending journey');
  }
};

/**
 * Journey steps enum for consistency
 */
export const JOURNEY_STEPS = {
  SEARCH_RESULTS: 'search_results',
  VIEW_DETAILS: 'view_details',
  BARGAIN_PRE: 'bargain_pre',
  BARGAIN_POST: 'bargain_post',
  BOOK: 'book',
  PAYMENT: 'payment',
  INVOICE: 'invoice',
  MY_TRIPS: 'my_trips'
} as const;

export type JourneyStep = typeof JOURNEY_STEPS[keyof typeof JOURNEY_STEPS];

/**
 * Validate journey step
 * @param step - Step to validate
 * @returns {boolean} True if valid step
 */
export const isValidJourneyStep = (step: string): step is JourneyStep => {
  return Object.values(JOURNEY_STEPS).includes(step as JourneyStep);
};

/**
 * Get journey metadata for debugging
 * @returns {Object} Journey metadata
 */
export const getJourneyMetadata = () => {
  const journeyId = getJourneyId();
  
  return {
    journeyId,
    startedAt: localStorage.getItem('fd_journey_started') || new Date().toISOString(),
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
};

/**
 * Set journey start time
 */
export const markJourneyStart = (): void => {
  try {
    localStorage.setItem('fd_journey_started', new Date().toISOString());
  } catch (error) {
    console.warn('localStorage not available for journey start time');
  }
};
