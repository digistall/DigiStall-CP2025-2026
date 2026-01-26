# DigiStall - MVC Role-Based Folder Structure

## Quick Start

### Backend (port 3001)
```bash
node server-mvc.js
```

### Frontend Web (port 5173)
```bash
cd FRONTEND-WEB
npm run dev
```

### Frontend Mobile (Expo)
```bash
cd FRONTEND-MOBILE
npm install          # First time only
npx expo start       # Start Expo dev server
```
Then scan QR code with Expo Go app on your phone.

## Role Permissions

| Role | Dashboard | Stalls | Stallholders | Payments | Complaints | Compliances | Vendors | Employees | Branches | Subscription |
|------|-----------|--------|--------------|----------|------------|-------------|---------|-----------|----------|--------------|
| **BUSINESS_OWNER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **BRANCH_MANAGER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **EMPLOYEE** | Based on permissions assigned by owner/manager |

**Note:** BUSINESS_OWNER and BRANCH_MANAGER share the same views from `BUSINESS_OWNER/FRONTEND-WEB/VIEWS/`. The only differences are:
- BUSINESS_OWNER can manage Branch Managers and Subscription
- BRANCH_MANAGER cannot add/edit branches or manage subscription

## Project Structure

```
DigiStall-CP2025-2026/
├── BACKEND-WEB/index.js       # Aggregator for web routes
├── BACKEND-MOBILE/index.js    # Aggregator for mobile routes
├── FRONTEND-WEB/              # Vue.js app (port 5173)
│   ├── App.js, package.json   # Expo entry point
│   ├── index.js               # Aggregator for Vue views
│   └── src/                   # App entry, router
├── FRONTEND-MOBILE/           # Expo/React Native app
│   ├── App.js                 # Main app component
│   ├── package.json           # Expo dependencies
│   ├── app.json               # Expo config
│   ├── index.js               # Screen aggregator
│   └── screens/               # Auth screens
│
├── BUSINESS_OWNER/            # Owner & Manager shared features
│   └── FRONTEND-WEB/VIEWS/    # Dashboard, Stalls, Payments, etc.
├── BRANCH_MANAGER/            # Branch-specific features only
│   └── FRONTEND-WEB/VIEWS/    # Branch management
├── STALL_HOLDER/              # Mobile app for stallholders
│   └── FRONTEND-MOBILE/SCREENS/
├── VENDOR/                    # Vendor management
├── EMPLOYEE/                  # Employee modules
│   ├── WEB_EMPLOYEE/          # Web-based employees
│   ├── INSPECTOR/             # Mobile inspectors
│   └── COLLECTOR/             # Mobile collectors
├── APPLICANTS/                # Applicant management
├── SYSTEM_ADMINISTRATOR/      # System admin panel
├── PUBLIC-LANDINGPAGE/        # Public landing page
│
├── SHARED/                    # Common utilities
│   ├── CONFIG/                # Database, CORS
│   ├── MIDDLEWARE/            # Auth, error handling
│   └── FRONTEND-WEB/          # Shared Vue components
│
├── server-mvc.js              # Backend entry point
└── Start-all.ps1              # Start all services
```

## Service URLs

| Service | URL | Command |
|---------|-----|---------|
| Backend API | http://localhost:3001 | `node server-mvc.js` |
| Frontend Web | http://localhost:5173 | `cd FRONTEND-WEB && npm run dev` |
| Mobile App | Expo QR Code | `cd FRONTEND-MOBILE && npx expo start` |
