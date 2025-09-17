/**
 * Date formatting utilities for consistent display across the application
 */

/**
 * Format a date to DD-MMM-YYYY format (e.g., "04-May-1978")
 * @param dateInput - Date string, Date object, or ISO string
 * @returns Formatted date string in DD-MMM-YYYY format
 */
export const formatAppDate = (dateInput: string | Date): string => {
  if (!dateInput) return "";

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    console.warn("Invalid date provided to formatAppDate:", dateInput);
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(/ /g, "-");
};

/**
 * Format a date for display with day name (e.g., "Mon, 04-May-1978")
 * @param dateInput - Date string, Date object, or ISO string
 * @returns Formatted date string with day name
 */
export const formatAppDateWithDay = (dateInput: string | Date): string => {
  if (!dateInput) return "";

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    console.warn("Invalid date provided to formatAppDateWithDay:", dateInput);
    return "";
  }

  const dayName = new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(
    date,
  );
  const formattedDate = formatAppDate(date);

  return `${dayName}, ${formattedDate}`;
};

/**
 * Parse a DD-MMM-YYYY formatted date back to a Date object
 * @param formattedDate - Date string in DD-MMM-YYYY format
 * @returns Date object or null if invalid
 */
export const parseAppDate = (formattedDate: string): Date | null => {
  if (!formattedDate) return null;

  const parts = formattedDate.split("-");
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  const year = parseInt(parts[2], 10);

  const monthMap: { [key: string]: number } = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const month = monthMap[monthStr];
  if (month === undefined) return null;

  return new Date(year, month, day);
};

/**
 * Check if a date is in the past
 * @param dateInput - Date string, Date object, or ISO string
 * @returns True if the date is in the past
 */
export const isDateInPast = (dateInput: string | Date): boolean => {
  if (!dateInput) return false;

  const date = new Date(dateInput);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date < today;
};

/**
 * Calculate the number of nights between two dates
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @returns Number of nights
 */
export const calculateNights = (
  checkIn: string | Date,
  checkOut: string | Date,
): number => {
  if (!checkIn || !checkOut) return 0;

  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
};

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 * @param dateInput - Date string, Date object, or ISO string
 * @returns Relative time string
 */
export const getRelativeTime = (dateInput: string | Date): string => {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffMinutes > 0) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  } else {
    return "Just now";
  }
};
