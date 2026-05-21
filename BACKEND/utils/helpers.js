/**
 * Shared utility helpers used across backend controllers.
 */

/**
 * Normalize an email to lowercase trimmed string.
 * @param {string} email
 * @returns {string}
 */
export const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

/**
 * Convert a value to null if it's empty/undefined, otherwise trim it.
 * @param {*} value
 * @returns {string|null}
 */
export const toNull = (value) => {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Validate email format.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const value = String(email || '').trim()
  return /^\S+@\S+\.\S+$/.test(value)
}

/**
 * Validate contact number (7-15 digits after stripping non-numeric chars).
 * @param {string} value
 * @returns {boolean}
 */
export const isValidContactNumber = (value) => {
  if (!value) return false
  const cleaned = String(value).replace(/[^0-9]/g, '')
  return cleaned.length >= 7 && cleaned.length <= 15
}

/**
 * Validate birthdate format (YYYY-MM-DD) and optionally check minimum age.
 * @param {string} dateStr
 * @param {number} [minAge=0] - Minimum age in years (0 = no age check)
 * @returns {{ valid: boolean, reason?: string }}
 */
export const isValidBirthdate = (dateStr, minAge = 0) => {
  if (!dateStr) return { valid: false, reason: 'Birthdate is required.' }

  const trimmed = String(dateStr).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { valid: false, reason: 'Birthdate must use YYYY-MM-DD format.' }
  }

  const date = new Date(trimmed)
  if (isNaN(date.getTime())) {
    return { valid: false, reason: 'Birthdate is not a valid date.' }
  }

  if (minAge > 0) {
    const today = new Date()
    const age = today.getFullYear() - date.getFullYear()
    const monthDiff = today.getMonth() - date.getMonth()
    const dayDiff = today.getDate() - date.getDate()
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age

    if (actualAge < minAge) {
      return { valid: false, reason: `Applicant must be at least ${minAge} years old.` }
    }
  }

  return { valid: true }
}
