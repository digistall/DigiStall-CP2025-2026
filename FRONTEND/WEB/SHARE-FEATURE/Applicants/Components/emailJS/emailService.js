// Email functionality has been migrated to the backend for security reasons.
// This file is kept as a dummy interface to prevent breaking changes in frontend components.

export const generateUsername = () => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const randomDigits = Math.floor(10000 + Math.random() * 90000).toString()
  return `${year}-${randomDigits}`
}

export const generatePassword = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  let password = ''
  for (let i = 0; i < 3; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  for (let i = 0; i < 3; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  return password
}

const dummySuccessResponse = async (recipientEmail, action) => {
  console.log(`✅ ${action} email dispatch delegated to backend for ${recipientEmail}`)
  return {
    success: true,
    message: `${action} notification dispatched by backend to ${recipientEmail}`,
  }
}

export const sendCredentialsEmailFetch = async (recipientEmail) => dummySuccessResponse(recipientEmail, 'Approval');
export const sendCredentialsEmailXHR = async (recipientEmail) => dummySuccessResponse(recipientEmail, 'Approval');
export const sendCredentialsEmailImproved = async (recipientEmail) => dummySuccessResponse(recipientEmail, 'Approval');
export const sendApprovalEmailWithRetry = async (recipientEmail) => dummySuccessResponse(recipientEmail, 'Approval');
export const sendDeclineNotificationEmail = async (recipientEmail) => dummySuccessResponse(recipientEmail, 'Decline');
export const sendDeclineEmailWithRetry = async (recipientEmail) => dummySuccessResponse(recipientEmail, 'Decline');
