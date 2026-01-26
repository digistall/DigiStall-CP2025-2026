# DigiStall MVC Role-Based Folder Structure

**Date:** January 26, 2026  
**Architecture:** MVC (Model-View-Controller) Role-Based Structure

## Overview

Each user role has its own folder containing:
- **BACKEND-WEB/** - Web API controllers, models, routes
- **BACKEND-MOBILE/** - Mobile API controllers, models, routes  
- **FRONTEND-WEB/** - Vue.js views, components, services
- **FRONTEND-MOBILE/** - React Native screens, components, services

---

## 📁 Folder Structure Summary

```
DigiStall-CP2025-2026/
│
├── server.js                    # Main backend entry point
├── package.json                 # Root dependencies
├── Start-all.ps1               # Startup script
│
│   ╔═══════════════════════════════════════════════════════╗
│   ║              ROLE-BASED MVC FOLDERS                   ║
│   ╚═══════════════════════════════════════════════════════╝
│
├── BUSINESS-OWNER/              # Business Owner (LGU) role
│   ├── BACKEND-WEB/
│   │   ├── CONTROLLERS/
│   │   ├── MODELS/
│   │   └── ROUTES/
│   ├── BACKEND-MOBILE/
│   │   ├── CONTROLLERS/
│   │   ├── MODELS/
│   │   └── ROUTES/
│   ├── FRONTEND-WEB/
│   │   ├── VIEWS/               # Dashboard, Employees, Stalls, etc.
│   │   ├── COMPONENTS/          # AppHeader, AppSidebar
│   │   └── SERVICES/
│   └── FRONTEND-MOBILE/
│       ├── SCREENS/
│       ├── COMPONENTS/
│       └── SERVICES/
│
├── BRANCH-MANAGER/              # Branch Manager role
│   ├── BACKEND-WEB/
│   ├── BACKEND-MOBILE/
│   ├── FRONTEND-WEB/
│   │   ├── VIEWS/               # Branch, Dashboard
│   │   └── COMPONENTS/          # AppHeader, AppSidebar
│   └── FRONTEND-MOBILE/
│
├── STALL-HOLDER/                # Stall Holder role
│   ├── BACKEND-WEB/
│   ├── BACKEND-MOBILE/
│   ├── FRONTEND-WEB/
│   │   └── VIEWS/               # Stallholders, Complaints, Compliances
│   └── FRONTEND-MOBILE/
│       └── SCREENS/             # StallHolder mobile screens
│
├── EMPLOYEE/                    # Employee role (Collector, Inspector)
│   ├── BACKEND-WEB/
│   ├── BACKEND-MOBILE/
│   ├── FRONTEND-WEB/
│   └── FRONTEND-MOBILE/
│       └── SCREENS/             # Collector, Inspector screens
│
├── VENDOR/                      # Vendor role
│   ├── BACKEND-WEB/
│   ├── BACKEND-MOBILE/
│   ├── FRONTEND-WEB/
│   │   └── VIEWS/               # Vendors management
│   └── FRONTEND-MOBILE/
│       └── SCREENS/             # Vendor mobile screens
│
├── APPLICANTS/                  # Applicants role
│   ├── BACKEND-WEB/
│   ├── BACKEND-MOBILE/
│   ├── FRONTEND-WEB/
│   │   └── VIEWS/               # Applicants management
│   └── FRONTEND-MOBILE/
│
├── AUTH/                        # Authentication (all users)
│   ├── BACKEND-WEB/
│   ├── BACKEND-MOBILE/
│   ├── FRONTEND-WEB/
│   │   └── VIEWS/               # Login, Register
│   └── FRONTEND-MOBILE/
│       └── SCREENS/             # LoginScreen, LoadingScreen
│
├── PUBLIC-LANDINGPAGE/          # Public landing page
│   ├── BACKEND-WEB/
│   ├── BACKEND-MOBILE/
│   ├── FRONTEND-WEB/
│   │   └── VIEWS/               # LandingPage components
│   └── FRONTEND-MOBILE/
│
├── SYSTEM-ADMINISTRATOR/        # System Admin role
│   ├── BACKEND-WEB/
│   ├── BACKEND-MOBILE/
│   ├── FRONTEND-WEB/
│   │   └── VIEWS/               # SystemAdmin components
│   └── FRONTEND-MOBILE/
│
│   ╔═══════════════════════════════════════════════════════╗
│   ║              SHARED BACKEND RESOURCES                 ║
│   ╚═══════════════════════════════════════════════════════╝
│
├── CONFIG/                      # Configuration files
├── MIDDLEWARE/                  # Express middleware
├── ROUTES/                      # Centralized route definitions
├── SERVICES/                    # Shared backend services
├── UTILS/                       # Utility functions
├── HELPERS/                     # Helper functions
├── DATABASE/                    # Database migrations, schemas
├── CONTROLLERS/                 # Shared controllers (lowercase)
│
│   ╔═══════════════════════════════════════════════════════╗
│   ║              SHARED FRONTEND RESOURCES                ║
│   ╚═══════════════════════════════════════════════════════╝
│
├── SHARED/                      # Shared frontend components
│   ├── FRONTEND-WEB/
│   │   ├── COMPONENTS/          # Common, MainLayout
│   │   ├── SERVICES/
│   │   ├── STORES/              # Pinia stores
│   │   ├── CONFIG/
│   │   ├── UTILS/
│   │   ├── ROUTER/
│   │   ├── PLUGINS/
│   │   └── ASSETS/
│   └── FRONTEND-MOBILE/
│       ├── COMPONENTS/          # Shared mobile components
│       ├── SERVICES/
│       └── CONFIG/
│
├── Frontend/                    # Original frontend (kept for build)
│   ├── Web/                     # Vue.js web application
│   └── Mobile/                  # React Native mobile app
│
└── uploads/                     # File uploads
```

---

## 📊 Role Folder Contents Summary

| Role | Web Views | Web Components | Mobile Screens |
|------|-----------|----------------|----------------|
| BUSINESS-OWNER | 9 | 2 | 0 |
| BRANCH-MANAGER | 2 | 2 | 0 |
| STALL-HOLDER | 7 | 0 | 1 |
| EMPLOYEE | 5 | 0 | 2 |
| VENDOR | 5 | 0 | 1 |
| APPLICANTS | 5 | 0 | 0 |
| AUTH | 4 | 0 | 2 |
| PUBLIC-LANDINGPAGE | 4 | 0 | 0 |
| SYSTEM-ADMINISTRATOR | 1 | 0 | 0 |
| SHARED | 0 | 4 | 0 |

---

## 🔧 How to Run

```powershell
# Start all services (Backend + Frontend Web + Frontend Mobile)
.\Start-all.ps1
```

**Backend:** http://localhost:3001  
**Frontend Web:** http://localhost:5173  
**Frontend Mobile:** Expo Go app

---

## 📝 Notes

1. **Frontend/ folder is kept** for the actual build process (Vue + Expo)
2. **Role folders** contain organized views/screens specific to each user type
3. **SHARED/ folder** contains common components used across all roles
4. **Backend entry point** is `server.js` which imports from role BACKEND folders
