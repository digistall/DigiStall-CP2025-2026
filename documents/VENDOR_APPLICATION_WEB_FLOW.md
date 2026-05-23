# Vendor Application (Web Entry) - End-to-End Flow

## Purpose
Move the vendor application entry point from mobile to the web landing page while keeping the existing backend workflow, admin approval, EmailJS credentials delivery, and mobile vendor login/dashboard.

## Architecture Overview

```
┌─────────────────┐     POST /api/public/vendor-applications/submit
│  Web Landing    │ ──────────────────────────────────────────────────► ┌──────────────┐
│  Page (Vue)     │                                                     │  Express API │
└─────────────────┘                                                     └──────┬───────┘
                                                                               │
                                                                               ▼
                                                                     ┌──────────────────┐
                                                                     │ vendor_applicant  │
                                                                     │ (status: pending) │
                                                                     └────────┬─────────┘
                                                                              │
                                                              Admin reviews via web panel
                                                                              │
                                                                              ▼
┌─────────────────┐     PUT /api/vendor-applicants/:id/approve       ┌──────────────────┐
│  Admin Panel    │ ────────────────────────────────────────────────► │  Creates:        │
│  (Vue)          │                                                   │  vendor_business │
└────────┬────────┘                                                   │  vendor          │
         │                                                            │  vendor_account  │
         │  EmailJS (credentials)                                     └──────────────────┘
         ▼
┌─────────────────┐
│  Vendor Email   │
│  (credentials)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     POST /api/mobile/auth/vendor-login
│  Mobile App     │ ────────────────────────────────────────────────► Vendor Dashboard
│  (React Native) │
└─────────────────┘
```

## User Flow
1. User opens the web landing page.
2. User clicks "Apply as Vendor" in the hero CTA area.
3. Vendor application modal opens on the landing page.
4. User submits vendor application form.
5. Data is stored in `vendor_applicant`.
6. Admin reviews vendor applications in the web admin panel.
7. Admin approves or rejects the application.
8. On approval, the system creates `vendor_business`, `vendor`, and `vendor_account`.
9. EmailJS sends vendor credentials to the applicant.
10. Vendor logs into the mobile app and accesses the vendor module.

## Web Landing Page Entry Point
- CTA location and styling: hero section beside "Apply for a Stall".
  - Component: [FRONTEND/WEB/LANDINGPAGE/LandingPage/components/stalls/StallSection.vue](FRONTEND/WEB/LANDINGPAGE/LandingPage/components/stalls/StallSection.vue)
  - Logic: [FRONTEND/WEB/LANDINGPAGE/LandingPage/components/stalls/StallSection.js](FRONTEND/WEB/LANDINGPAGE/LandingPage/components/stalls/StallSection.js)
  - Styles: [FRONTEND/WEB/LANDINGPAGE/assets/css/StallSection.css](FRONTEND/WEB/LANDINGPAGE/assets/css/StallSection.css)

## Vendor Application Form (Web)
- Container component (modal): [FRONTEND/WEB/LANDINGPAGE/LandingPage/components/stalls/VendorApplicationContainer.vue](FRONTEND/WEB/LANDINGPAGE/LandingPage/components/stalls/VendorApplicationContainer.vue)
- Uses shared overlay styles: [FRONTEND/WEB/LANDINGPAGE/assets/LandingPage/css/applicationformstyle.css](FRONTEND/WEB/LANDINGPAGE/assets/LandingPage/css/applicationformstyle.css)
- Loading/feedback overlay: [FRONTEND/WEB/LANDINGPAGE/LandingPage/components/common/ApplicationLoadingOverlay.vue](FRONTEND/WEB/LANDINGPAGE/LandingPage/components/common/ApplicationLoadingOverlay.vue)

### Fields Collected
Vendor Information:
- `first_name`
- `middle_name`
- `last_name`
- `suffix`
- `contact_number`
- `email`
- `birthdate`
- `gender`
- `address`
- `civil_status`

Vendor Business Information:
- `business_name`
- `business_type`
- `business_description`
- `products`

### Validation Rules
- Required fields: all fields above except `middle_name` and `suffix`.
- Email format must match a standard pattern.
- Contact number must be 7 to 15 digits.
- Birthdate must be in `YYYY-MM-DD` format.
- Applicant must be at least 18 years old.
- Validation is enforced on both frontend and backend.

## Public Submission Endpoint
- POST `/api/public/vendor-applications/submit` (preferred)
- POST `/api/mobile/vendor-applications/submit` (backward compatibility)
  - Route: [routes/vendorApplicationRoutes.js](routes/vendorApplicationRoutes.js)
  - Controller: [BACKEND/PUBLIC/vendorApplicantController.js](BACKEND/PUBLIC/vendorApplicantController.js)
  - Shared utilities: [BACKEND/utils/helpers.js](BACKEND/utils/helpers.js)

## Backend Processing
- `vendor_applicant` row is created (pending by default).
- Duplicate email checks are enforced on submission and approval (checks `vendor_applicant`, `vendor_account`, and `vendor` tables).
- Database tables (run once):
  - [DATABASE/STORED_PROCEDURES/vendor_applicant_tables.sql](DATABASE/STORED_PROCEDURES/vendor_applicant_tables.sql)

## Admin Review and Approval
- Admin API (protected with `enhancedAuthMiddleware` + role check):
  - Route: [routes/vendorApplicantRoutes.js](routes/vendorApplicantRoutes.js)
  - Controller: [BACKEND/MANAGER/vendorApplicants/vendorApplicantController.js](BACKEND/MANAGER/vendorApplicants/vendorApplicantController.js)
- Admin endpoints:
  - `GET /api/vendor-applicants` — List all applicants (supports `?status=` and `?search=` filters)
  - `GET /api/vendor-applicants/:id` — Get single applicant details
  - `PUT /api/vendor-applicants/:id/approve` — Approve and create vendor records
  - `PUT /api/vendor-applicants/:id/status` — Reject (requires `decline_reason` of 10+ chars)
- Allowed roles: `system_administrator`, `stall_business_owner`, `business_manager`, `business_employee`
- Admin UI:
  - Applicants list: [FRONTEND/WEB/SHARE-FEATURE/Applicants/Applicants.js](FRONTEND/WEB/SHARE-FEATURE/Applicants/Applicants.js)
  - Applicants UI: [FRONTEND/WEB/SHARE-FEATURE/Applicants/Applicants.vue](FRONTEND/WEB/SHARE-FEATURE/Applicants/Applicants.vue)
  - Approval modal: [FRONTEND/WEB/SHARE-FEATURE/Applicants/Components/ApproveApplicants/ApproveApplicants.js](FRONTEND/WEB/SHARE-FEATURE/Applicants/Components/ApproveApplicants/ApproveApplicants.js)
  - Decline modal: [FRONTEND/WEB/SHARE-FEATURE/Applicants/Components/DeclineApplicants/DeclineApplicants.js](FRONTEND/WEB/SHARE-FEATURE/Applicants/Components/DeclineApplicants/DeclineApplicants.js)

### Approval Side Effects
- Creates (in a single transaction):
  - `vendor_business`
  - `vendor`
  - `vendor_account`
- Updates `vendor_applicant` status to `approved` and records timestamps.
- Generates a secure 10-character password (uppercase + lowercase + digits) and returns credentials to the admin UI for email sending.

## Credentials Email
- EmailJS integration for approval/decline emails:
  - [FRONTEND/WEB/SHARE-FEATURE/Applicants/Components/emailJS/emailService.js](FRONTEND/WEB/SHARE-FEATURE/Applicants/Components/emailJS/emailService.js)
- Configuration via environment variables (`.env`):
  - `VITE_EMAILJS_SERVICE_ID`
  - `VITE_EMAILJS_APPROVE_TEMPLATE_ID`
  - `VITE_EMAILJS_DECLINE_TEMPLATE_ID`
  - `VITE_EMAILJS_PUBLIC_KEY`
  - `VITE_EMAILJS_SENDER_EMAIL`
  - `VITE_EMAILJS_SENDER_NAME`
- Retry mechanism: fetch → XHR → EmailJS SDK (3 attempts with different transport methods)

## Vendor Login (Mobile Only)
- Vendor login endpoint:
  - POST `/api/mobile/auth/vendor-login`
  - Route: [routes/authRoutes.js](routes/authRoutes.js)
  - Controller: [BACKEND/AUTH/vendorAuthController.js](BACKEND/AUTH/vendorAuthController.js)
- Mobile login flow and vendor routing:
  - [FRONTEND/MOBILE/AUTH/LoginScreen/LoginFunction/LoginFunctions.js](FRONTEND/MOBILE/AUTH/LoginScreen/LoginFunction/LoginFunctions.js)
  - [FRONTEND/MOBILE/App.js](FRONTEND/MOBILE/App.js)
  - Vendor home: [FRONTEND/MOBILE/VENDOR/VendorHome.js](FRONTEND/MOBILE/VENDOR/VendorHome.js)

## Error Handling
- Frontend shows inline validation errors with field highlighting.
- Backend returns structured JSON errors with `{ success: false, message, missingFields? }`.
- Email failures do not block approval — the admin sees a warning toast and credentials are still stored in the database.
- The email service retries up to 3 times using different transport methods before reporting failure.

## Notes
- The mobile app no longer exposes a vendor application screen or navigation route.
- The vendor application entry point is now web-only, while vendor login remains mobile-only.
- Shared backend utilities are in `BACKEND/utils/helpers.js` (normalizeEmail, toNull, isValidEmail, isValidContactNumber, isValidBirthdate).

## Test Checklist
- [ ] Web landing page shows both CTAs in the hero section.
- [ ] Vendor form opens, validates, and submits successfully.
- [ ] Age validation rejects applicants under 18.
- [ ] `vendor_applicant` row is created with `pending` status.
- [ ] Duplicate email is rejected on submission.
- [ ] Admin can list, filter, and search vendor applicants.
- [ ] Admin can approve vendor applicants (creates vendor records).
- [ ] Admin can reject vendor applicants (requires decline reason).
- [ ] Approval creates vendor records and sends credentials email.
- [ ] Decline sends a notification email to the applicant.
- [ ] Vendor can log in on mobile and access vendor dashboard.
- [ ] EmailJS env vars are loaded correctly (no hardcoded keys in source).
