// Email functionality has been migrated to the backend for security reasons.
// This file is kept as a dummy interface to prevent breaking changes in frontend components.

export const generateEmployeeUsername = () => {
  const randomDigits = Math.floor(1000 + Math.random() * 9000).toString()
  return `EMP${randomDigits}`
}

export const generateEmployeePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export const sendEmployeeCredentialsEmailWithRetry = async (
  recipientEmail,
  employeeName,
  username,
  password,
) => {
  console.log('✅ Employee credentials email dispatch delegated to backend')
  return {
    success: true,
    message: `Employee credentials dispatched by backend to ${recipientEmail}`,
  }
}

export const sendEmployeePasswordResetEmail = async (recipientEmail, employeeName, newPassword) => {
  console.log('✅ Employee password reset email dispatch delegated to backend')
  return {
    success: true,
    message: `Password reset notification dispatched by backend to ${recipientEmail}`,
  }
}

export const sendEmployeeCredentialsEmail = sendEmployeeCredentialsEmailWithRetry;

export default {
  sendEmployeeCredentialsEmailWithRetry,
  sendEmployeeCredentialsEmail,
  sendEmployeePasswordResetEmail,
  generateEmployeeUsername,
  generateEmployeePassword,
}
