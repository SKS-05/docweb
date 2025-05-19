/**
 * Validation utilities for email and other fields
 */

/**
 * Validates email format using RFC 5322 compliant regex
 * @param email Email address to validate
 * @returns Boolean indicating if email format is valid
 */
export function validateEmail(email: string): boolean {
  // RFC 5322 compliant email regex
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
}

/**
 * Check if a string is empty or only whitespace
 * @param value String to check
 * @returns Boolean indicating if the string is empty
 */
export function isEmpty(value: string): boolean {
  return value.trim().length === 0;
}

/**
 * Validates password strength
 * @param password Password to validate
 * @returns Object with validation result and optional error message
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number" };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }
  
  return { isValid: true };
} 