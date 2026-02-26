# Forgot Password Feature - Setup Guide

## Overview

The Forgot Password feature allows users to reset their password using email verification. It uses **Nodemailer** (the existing email service) to send verification codes from the backend server.

## How It Works

1. **User enters email** - The system verifies the email exists in the database
2. **Verification code sent** - A 6-digit code is generated and sent via the backend Nodemailer service
3. **User enters code** - The system verifies the code
4. **Password reset** - User creates a new password (encrypted with AES-256-GCM)

## Setup Instructions

### SMTP Configuration

The Forgot Password feature uses the existing Nodemailer email service. Ensure your SMTP settings are configured in the root `.env` file:

```env
# SMTP Configuration (for password reset emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Note:** If using Gmail, you need to:
1. Enable 2-Factor Authentication on your Google account
2. Generate an "App Password" at https://myaccount.google.com/apppasswords
3. Use the App Password as `SMTP_PASS`

### No Additional Setup Required

Since this feature uses the existing Nodemailer service (`services/emailService.js`), no additional configuration is needed if email sending is already working for credentials emails.

## Files Created/Modified

### Frontend
- `AUTH/FRONTEND-WEB/VIEWS/ForgotPassword/ForgotPassword.vue` - Main component
- `AUTH/FRONTEND-WEB/VIEWS/ForgotPassword/ForgotPassword.js` - Component logic
- `AUTH/FRONTEND-WEB/VIEWS/ForgotPassword/ForgotPassword.css` - Styling
- `FRONTEND-RUNNER/WEB/src/router/index.js` - Added route

### Backend
- `SHARE-CONTROLLER/auth/passwordResetController.js` - Reset logic with Nodemailer integration
- `services/emailService.js` - Added `sendPasswordResetCodeEmail` method
- `routes/webAuthRoutes.js` - API endpoints

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-reset-code` | Verify email exists & send verification code |
| POST | `/api/auth/verify-reset-code` | Verify user's code |
| POST | `/api/auth/reset-password` | Reset password |

## Security Features

1. **Code Expiration** - Verification codes expire after 10 minutes
2. **Attempt Limiting** - Maximum 5 failed attempts per code
3. **Password Strength** - Requires 8+ chars, uppercase, lowercase, and number
4. **Password Encryption** - Uses AES-256-GCM encryption (same as existing system)
5. **Server-side Email** - Email sent from backend, not exposed to client
6. **Code Cleanup** - Codes are automatically removed after verification or expiry

## Testing

1. Navigate to `/login`
2. Click "Forgot Password?"
3. Enter a registered email address
4. Check your email for the verification code
5. Enter the 6-digit code
6. Create a new password (min 8 chars, uppercase, lowercase, number)
7. Login with your new password

## Troubleshooting

### Email not received
- Check spam/junk folder
- Verify SMTP settings in `.env` file
- Check server logs for email sending errors
- Ensure SMTP_USER and SMTP_PASS are correct

### Invalid code error
- Codes expire after 10 minutes
- Each code can only be used once
- Request a new code if expired

### Email not found
- Ensure the email is registered in the system
- Email must match exactly (case-insensitive)

### SMTP Connection Error
- Verify SMTP_HOST and SMTP_PORT are correct
- For Gmail: Use port 587 with TLS
- For Gmail: Ensure App Password is used (not regular password)

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vue Frontend  │────▶│  Express API    │────▶│   Nodemailer    │
│                 │     │                 │     │                 │
│  ForgotPassword │     │  passwordReset  │     │  emailService   │
│     .vue/.js    │     │   Controller    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │    MySQL DB     │
                        │                 │
                        │ Stored Procs    │
                        │ (email lookup)  │
                        └─────────────────┘
```

## Notes

- Uses the same email service as credential emails (Nodemailer)
- No external API limits (unlike EmailJS free tier)
- All passwords are encrypted using the same AES-256-GCM method as the existing system
- Reset codes are stored in server memory (consider Redis for production scaling)
