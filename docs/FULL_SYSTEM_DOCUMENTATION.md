# DigiStall - Naga City Stall Management System
## Complete System Documentation

**Last Updated:** January 5, 2026  
**System Version:** 1.0.1  
**Status:** Production Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Deployment & Infrastructure](#deployment--infrastructure)
4. [Landing Page (Public Website)](#landing-page-public-website)
5. [Web Portal (Admin/Management)](#web-portal-adminmanagement)
6. [Mobile Application](#mobile-application)
7. [Backend APIs](#backend-apis)
8. [Database Structure](#database-structure)
9. [User Roles & Permissions](#user-roles--permissions)
10. [Application Flow](#application-flow)
11. [Tech Stack](#tech-stack)
12. [Recent Fixes & Improvements](#recent-fixes--improvements)
13. [Troubleshooting & Support](#troubleshooting--support)

---

## System Overview

**DigiStall** is a comprehensive Stall Management System designed for Naga City. It provides a complete solution for managing market stalls, stallholders, payments, compliance, and inspections across multiple branches.

### Key Features
- 🏪 **Stall Management** - Track and manage stalls across multiple branches
- 👥 **Stallholder Management** - Register and manage stallholders with document tracking
- 💰 **Payment Processing** - Automated rent payments with late fees and early discounts
- 📋 **Compliance & Inspections** - Real-time violation reporting via mobile app
- 🎲 **Raffle & Auction System** - Allocate vacant stalls through raffles and auctions
- 📱 **Mobile Application** - For stallholders, inspectors, collectors, and vendors
- 🔐 **Role-Based Access Control** - Multiple user types with granular permissions
- 🐳 **Docker-Based Deployment** - Easy deployment with Docker Compose
- ☁️ **Cloud Database** - AWS RDS MySQL for data persistence
- ⏰ **Timezone Management** - Philippine Time (UTC+8) synchronization
- 📊 **Real-time Session Tracking** - Active employee/staff monitoring
- 📤 **Excel Import/Export** - Bulk operations for stallholder data

### Current Production Setup
- **Frontend:** DigitalOcean Droplet (68.183.154.125)
- **Backend Web API:** Port 5000
- **Backend Mobile API:** Port 5001
- **Database:** AWS RDS MySQL (db.cjunttcqcwlh.ap-southeast-1.rds.amazonaws.com)
- **Deployment:** Docker Compose orchestration

---

## Architecture

### System Diagram
```
┌─────────────────────────────────────────────────────────────────────┐
│                        DIGISTALL SYSTEM                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐ │
│  │  LANDING    │    │    WEB      │    │       MOBILE APP        │ │
│  │   PAGE      │    │   PORTAL    │    │     (React Native)      │ │
│  │  (Public)   │    │  (Vue 3)    │    │                         │ │
│  │             │    │             │    │  ┌────┐ ┌────┐ ┌────┐  │ │
│  │ • View      │    │ • Dashboard │    │  │Stall│ │Insp│ │Coll│  │ │
│  │   Stalls    │    │ • Manage    │    │  │hold-│ │ect-│ │ect-│  │ │
│  │ • Apply     │    │   Stalls    │    │  │ er  │ │ or │ │ or │  │ │
│  │   for       │    │ • Payments  │    │  └────┘ └────┘ └────┘  │ │
│  │   Stalls    │    │ • Reports   │    │                         │ │
│  │             │    │             │    │  ┌────┐                 │ │
│  │ Vite Build  │    │ Vite Build  │    │  │Vend│    Expo Go      │ │
│  │ + Nginx     │    │ + Vuetify   │    │  │ or │                 │ │
│  └──────┬──────┘    └──────┬──────┘    │  └────┘                 │ │
│         │                  │           └───────────┬─────────────┘ │
│         │                  │                       │               │
│         └──────────────────┼───────────────────────┘               │
│                            │                                       │
│                            ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    BACKEND SERVERS (Node.js + Express)      │  │
│  │                                                              │  │
│  │  ┌──────────────────┐      ┌──────────────────┐             │  │
│  │  │  Backend-Web     │      │  Backend-Mobile  │             │  │
│  │  │  (Port 5000)     │      │  (Port 5001)     │             │  │
│  │  │                  │      │                  │             │  │
│  │  │  /api/auth       │      │  /api/mobile/    │             │  │
│  │  │  /api/stalls     │      │    auth          │             │  │
│  │  │  /api/payments   │      │    stalls        │             │  │
│  │  │  /api/branches   │      │    stallholder   │             │  │
│  │  │  /api/complaints │      │    inspector     │             │  │
│  │  │  /api/health     │      │    collector     │             │  │
│  │  │                  │      │                  │             │  │
│  │  │ JWT Auth         │      │ JWT Auth         │             │  │
│  │  │ Multer Upload    │      │ Document Upload  │             │  │
│  │  └──────────────────┘      └──────────────────┘             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                            │                                       │
│                            ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              AWS RDS MySQL DATABASE                          │  │
│  │              (naga_stall_digitalocean)                       │  │
│  │                                                              │  │
│  │  • 50+ Tables                                                │  │
│  │  • Stored Procedures (Timezone-aware)                        │  │
│  │  • Connection Pool: 5 concurrent                             │  │
│  │  • Timezone: UTC (Server) → PHP Time (Application)           │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Container Architecture (Docker)
```
┌──────────────────────────────────────────────────────────┐
│                  Docker Compose Stack                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  frontend-web (nginx:alpine)                      │  │
│  │  Port: 80                                         │  │
│  │  • Vite build output                              │  │
│  │  • Nginx reverse proxy                            │  │
│  │  • API proxy to backend                           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  backend-web (node:20-alpine)                     │  │
│  │  Port: 5000                                       │  │
│  │  • Express.js server                              │  │
│  │  • Web API routes                                 │  │
│  │  • File uploads: ./uploads                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  backend-mobile (node:20-alpine)                  │  │
│  │  Port: 5001                                       │  │
│  │  • Express.js server                              │  │
│  │  • Mobile API routes                              │  │
│  │  • File uploads: ./uploads                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Network: digistall-network (bridge)                    │
│  Volumes: ./uploads (shared across containers)          │
│                                                          │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   External AWS RDS DB   │
              │   (Not in Docker)       │
              └─────────────────────────┘
```

---

## Deployment & Infrastructure

### Production Deployment (DigitalOcean)
**Droplet Details:**
- **Server:** digistall-server
- **IP:** 68.183.154.125
- **Specs:** 4GB RAM, 80GB Disk, 2 vCPUs
- **Cost:** $20/month
- **OS:** Ubuntu 22.04 LTS

**Services Running:**
- Docker & Docker Compose
- Frontend (Port 80 - Nginx)
- Backend Web API (Port 5000)
- Backend Mobile API (Port 5001)

### Database (AWS RDS)
- **Host:** db.cjunttcqcwlh.ap-southeast-1.rds.amazonaws.com
- **Port:** 3306
- **Database:** naga_stall_digitalocean
- **Region:** ap-southeast-1 (Singapore)
- **Engine:** MySQL 8.0
- **Connection Pool:** 5 connections
- **Timeout:** 60 seconds
- **Keep-Alive:** Enabled

### Environment Variables
Required in `.env` files:
```env
# Database Configuration
DB_HOST=db.cjunttcqcwlh.ap-southeast-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=[secure_password]
DB_NAME=naga_stall_digitalocean

# JWT Secrets
JWT_SECRET=your_jwt_secret_key_change_me
JWT_REFRESH_SECRET=your_jwt_refresh_secret_change_me

# API Ports
WEB_PORT=5000
MOBILE_PORT=5001

# CORS Configuration
CORS_ORIGIN=http://68.183.154.125
ALLOWED_ORIGINS=http://68.183.154.125,http://localhost

# Upload Directories
UPLOAD_DIR_STALLS=/app/uploads/stalls
UPLOAD_DIR_APPLICANTS=/app/uploads/applicants
```

### Quick Deployment Commands
```bash
# Connect to server
ssh root@68.183.154.125

# Deploy using script
curl -fsSL https://raw.githubusercontent.com/digistall/DigiStall-CP2025-2026/FullBranch/deploy-to-droplet.sh | bash

# Or manually
git clone https://github.com/digistall/DigiStall-CP2025-2026.git
cd DigiStall-CP2025-2026
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

### Health Monitoring
```bash
# Check server health
curl http://68.183.154.125/api/health

# Expected response:
{
  "success": true,
  "message": "Server and database are healthy",
  "services": {
    "server": "running",
    "database": "connected",
    "dbResponseTime": "~3000ms"
  }
}
```

---

## Landing Page (Public Website)

### Location
`Frontend/Web/src/components/LandingPage/`

### Description
The public-facing website where users can learn about the stall management system, view available stalls, and apply for stalls.

### Components

#### 1. **Header Section** (`components/header/HeaderSection.vue`)
- Navigation menu
- Logo display
- Login/Register buttons
- Responsive mobile menu

#### 2. **Stall Section** (`components/stalls/StallSection.vue`)
- Showcases available stalls
- Interactive stall browsing
- Filter by branch/area
- Stall details display

#### 3. **Vendor Section** (`components/vendor/VendorSection.vue`)
- Information for potential vendors
- Benefits of becoming a stallholder
- Application process overview

#### 4. **Compliance Section** (`components/compliance/ComplianceSection.vue`)
- Compliance requirements information
- Rules and regulations
- Documentation requirements

#### 5. **Footer Section** (`components/footer/FooterSection.vue`)
- Contact information
- Quick links
- Social media links
- Copyright information

### Features
- **Scroll Progress Indicator** - Visual progress line showing scroll position
- **Animated Sections** - Scroll-triggered animations
- **3D Card Effects** - Interactive hover effects
- **Responsive Design** - Mobile-friendly layout

### Route
```javascript
{ path: '/', name: 'landingPage', component: LandingPage }
```

---

## Web Portal (Admin/Management)

### Location
`Frontend/Web/src/components/Admin/` and `Frontend/Web/src/components/SystemAdmin/`

### Access
Route: `/login` → `/app/dashboard` (Business Users) or `/system-admin/dashboard` (System Admin)

### User Types & Access

#### 1. **System Administrator** (`/system-admin/*`)
| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/system-admin/dashboard` | Platform overview, statistics, AI suggestions |
| Business Owners | `/system-admin/business-owners` | Manage business owner accounts |
| Payments | `/system-admin/payments` | Subscription payments management |
| Reports | `/system-admin/reports` | System-wide reports |

#### 2. **Stall Business Owner** (`/app/*`)
| Module | Route | Permission | Description |
|--------|-------|------------|-------------|
| Dashboard | `/app/dashboard` | - | Branch statistics & overview |
| Branch | `/app/branch` | Owner Only | Branch management |
| Subscription | `/app/subscription` | Owner Only | Subscription management |
| Employees | `/app/employees` | Owner/Manager | Employee management |
| All Modules | `/app/*` | All | Full access to all features |

#### 3. **Business Manager** (`/app/*`)
| Module | Route | Permission | Description |
|--------|-------|------------|-------------|
| Dashboard | `/app/dashboard` | - | Branch statistics |
| Employees | `/app/employees` | employees | Employee management |
| All Modules | `/app/*` | All | Full access except branch/subscription |

#### 4. **Business Employee** (`/app/*`)
| Module | Route | Permission Required | Description |
|--------|-------|---------------------|-------------|
| Dashboard | `/app/dashboard` | dashboard | View statistics |
| Complaints | `/app/complaints` | complaints | Handle complaints |
| Payment | `/app/payment` | payments | Payment processing |
| Applicants | `/app/applicants` | applicants | Application management |
| Compliances | `/app/compliances` | compliances | Compliance tracking |
| Inspectors | `/app/inspectors` | compliances | Inspector management |
| Vendors | `/app/vendors` | vendors | Vendor management |
| Stallholders | `/app/stallholders` | stallholders | Stallholder management |
| Collectors | `/app/collectors` | collectors | Collector management |
| Stalls | `/app/stalls` | stalls | Stall management |
| Raffles | `/app/stalls/raffles` | stalls | Raffle management |
| Auctions | `/app/stalls/auctions` | stalls | Auction management |

### Web Portal Modules

#### Dashboard (`/app/dashboard`)
```
┌─────────────────────────────────────────────────────────────────┐
│                        DASHBOARD                                 │
├──────────────────┬──────────────────┬──────────────────┬────────┤
│   Total Stalls   │ Active           │ Total Payments   │Employe-│
│   [Store Icon]   │ Stallholders     │ ₱XXX,XXX         │  es    │
│      XXX         │     XXX          │                  │  XXX   │
├──────────────────┴──────────────────┴──────────────────┴────────┤
│                                                                  │
│   [Charts: Payment Trends, Stall Occupancy]                     │
│                                                                  │
│   [Recent Activities Table]                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- Key metrics cards (Total Stalls, Stallholders, Payments, Employees)
- Export data to Excel
- Payment trend charts
- Stall occupancy visualization
- Recent activity feed

#### Stalls Management (`/app/stalls`)
```
Features:
├── View All Stalls
│   ├── Filter by Branch/Floor/Section
│   ├── Search functionality
│   └── Stall status indicators
├── Stall Details
│   ├── Stall information
│   ├── Current occupant
│   ├── Payment history
│   └── Compliance status
├── Stall CRUD Operations
│   ├── Add new stall
│   ├── Edit stall details
│   ├── Delete stall
│   └── Upload stall images
├── Raffle System (/app/stalls/raffles)
│   ├── Create raffle for vacant stalls
│   ├── Manage participants
│   └── Draw winners
└── Auction System (/app/stalls/auctions)
    ├── Create auction for premium stalls
    ├── Manage bids
    └── Select winners
```

#### Stallholders Management (`/app/stallholders`)
```
Features:
├── Stallholder List
│   ├── Search & Filter
│   ├── Status indicators
│   └── Quick actions
├── Stallholder Profile
│   ├── Personal information
│   ├── Business details
│   ├── Assigned stalls
│   ├── Payment history
│   └── Document uploads
├── Import from Excel
│   └── Bulk stallholder import
├── Export to Excel
│   └── Generate stallholder reports
└── Document Management
    ├── Required documents tracking
    └── Document verification
```

#### Payments (`/app/payment`)
```
Features:
├── Payment Recording
│   ├── On-site payment collection
│   ├── Online payment verification
│   └── Payment receipt generation
├── Payment History
│   ├── View all payments
│   ├── Filter by date/stallholder
│   └── Payment status tracking
├── Due Management
│   ├── Overdue payments list
│   ├── Late fee calculation (automatic)
│   └── Early payment discount
├── Reports
│   ├── Daily collection report
│   ├── Monthly revenue report
│   └── Export functionality
└── Payment Calculations
    ├── 25% Early Payment Discount (5+ days before due)
    ├── Late Fee Calculation
    └── Automatic due date tracking
```

#### Applicants (`/app/applicants`)
```
Features:
├── Application List
│   ├── Pending applications
│   ├── Approved applications
│   └── Rejected applications
├── Application Processing
│   ├── Review application details
│   ├── Verify documents
│   ├── Approve/Reject with notes
│   └── Assign stall to approved applicant
├── Document Verification
│   ├── View submitted documents
│   └── Mark documents as verified
└── Convert to Stallholder
    └── Create stallholder account from approved application
```

#### Compliance (`/app/compliances`)
```
Features:
├── Compliance Records
│   ├── Violation tracking
│   ├── Compliance status per stallholder
│   └── Historical compliance data
├── Inspection Management
│   ├── Schedule inspections
│   ├── Assign inspectors
│   └── Track inspection results
└── Compliance Reports
    ├── Violation summary
    └── Compliance trends
```

#### Complaints (`/app/complaints`)
```
Features:
├── Complaint List
│   ├── Open complaints
│   ├── In-progress complaints
│   └── Resolved complaints
├── Complaint Handling
│   ├── View complaint details
│   ├── Assign to staff
│   ├── Update status
│   └── Add resolution notes
└── Complaint Analytics
    ├── Complaint categories
    └── Resolution time tracking
```

#### Branch Management (`/app/branch`) - Owner Only
```
Features:
├── Branch Information
│   ├── Branch details
│   ├── Operating hours
│   └── Contact information
├── Floor Management
│   ├── Add/Edit floors
│   └── Floor layout
├── Section Management
│   ├── Add/Edit sections
│   └── Section allocation
└── Document Requirements
    ├── Configure required documents
    └── Customize per branch
```

#### Employee Management (`/app/employees`)
```
Features:
├── Employee List
│   ├── Active employees
│   ├── Inactive employees
│   └── Role-based filtering
├── Employee CRUD
│   ├── Add new employee
│   ├── Edit employee details
│   ├── Assign permissions
│   └── Deactivate employee
└── Permission Management
    ├── dashboard
    ├── applicants
    ├── complaints
    ├── compliances
    ├── vendors
    ├── stallholders
    ├── collectors
    ├── stalls
    └── payments
```

#### Mobile Staff Management
**Inspectors** (`/app/inspectors`)
```
├── Inspector List
├── Add/Edit Inspector
├── Assign to Branch
├── View Activity Log
└── Performance Reports
```

**Collectors** (`/app/collectors`)
```
├── Collector List
├── Add/Edit Collector
├── Assign to Branch
├── Collection Summary
└── Activity Tracking
```

---

## Mobile Application

### Location
`Frontend/Mobile/`

### Technology
- **React Native** with Expo
- **React Navigation** for routing

### Entry Point
`App.js` - Main navigation container

### Authentication Flow
```javascript
// Navigation Stack
LoginScreen → [Auth Check] → {
  StallHome      // For Stallholders
  InspectorHome  // For Inspectors
  CollectorHome  // For Collectors
  VendorHome     // For Vendors
}
```

### Mobile User Types

#### 1. **Stallholder** (`screens/StallHolder/`)
```
StallHome
├── Navigation
│   ├── Header (Menu, Title)
│   ├── Bottom Navbar (Documents, Stall, Payment)
│   └── Sidebar (Full Menu)
│
├── Screens
│   ├── Dashboard
│   │   └── Overview of stall status, payments, notifications
│   │
│   ├── Stall Management (TabbedStallScreen)
│   │   ├── View assigned stalls
│   │   ├── Stall details
│   │   └── Stall images
│   │
│   ├── Documents
│   │   ├── Required documents list
│   │   ├── Upload documents
│   │   └── Document status tracking
│   │
│   ├── Payment
│   │   ├── Payment history
│   │   ├── Due payments
│   │   └── Payment status
│   │
│   ├── Reports
│   │   └── Personal reports
│   │
│   ├── Notifications
│   │   └── System notifications
│   │
│   ├── Raffle
│   │   ├── Available raffles
│   │   └── Join raffle
│   │
│   ├── Auction
│   │   ├── Active auctions
│   │   └── Place bids
│   │
│   └── Settings
│       ├── Profile settings
│       ├── Theme (Light/Dark mode)
│       └── Logout
```

**Stallholder Features:**
- View assigned stalls and details
- Upload and manage required documents
- Track payment history and due dates
- Receive notifications
- Participate in raffles and auctions
- Dark/Light theme support

#### 2. **Inspector** (`screens/Inspector/`)
```
InspectorHome
├── Navigation
│   ├── Header
│   ├── Bottom Navbar (Dashboard, Stallholders, Stalls, Report)
│   └── Sidebar
│
├── Screens
│   ├── Dashboard
│   │   ├── Today's inspections
│   │   ├── Quick stats
│   │   └── Recent activities
│   │
│   ├── Stallholders
│   │   ├── List of stallholders
│   │   ├── Search functionality
│   │   └── Select for reporting
│   │
│   ├── Stalls
│   │   ├── Stall list by branch
│   │   ├── Stall status
│   │   └── Select for reporting
│   │
│   ├── Report Violation
│   │   ├── Select stallholder/stall
│   │   ├── Violation type
│   │   ├── Description
│   │   ├── Photo evidence
│   │   └── Submit report
│   │
│   └── Settings
│       └── Profile & preferences
```

**Inspector Features:**
- View assigned branch stallholders and stalls
- File compliance violation reports
- Attach photo evidence
- Track submitted reports
- Dashboard with inspection statistics

#### 3. **Collector** (`screens/Collector/`)
```
CollectorHome
├── Navigation
│   ├── Header with Menu
│   └── Sidebar (Home, Profile, Settings, Logout)
│
├── Screens
│   ├── Home
│   │   ├── Welcome card
│   │   └── Collection dashboard (Coming Soon)
│   │
│   ├── Profile
│   │   ├── Personal information
│   │   └── Branch assignment
│   │
│   └── Settings
│       └── App preferences
```

**Collector Features:**
- View collection assignments
- Record on-site payments
- Track daily collections
- View collection history

#### 4. **Vendor** (`screens/Vendor/`)
```
VendorHome
└── Basic Interface
    ├── Welcome message
    └── Logout functionality
```

**Vendor Features:**
- Basic vendor portal (Future development)
- View stall availability
- Application status tracking

### Mobile Login Screen (`screens/LoginScreen/`)
```
LoginScreen
├── UI Elements
│   ├── Background image
│   ├── Logo
│   ├── Username field
│   ├── Password field (with visibility toggle)
│   └── Login button
│
├── Loading States
│   ├── Server Connection
│   ├── Authentication
│   ├── Profile Data
│   ├── Dashboard Setup
│   └── Finalizing
│
├── Error Handling
│   ├── Network errors
│   ├── Invalid credentials
│   └── Server errors
│
└── Authentication
    ├── JWT token management
    ├── Auto-login (token persistence)
    └── Role-based navigation
```

### Mobile Services (`services/`)

#### ApiService.js
- API communication layer
- Token management
- Request/response handling

#### UserStorageService.js
- Secure token storage
- User data persistence
- Session management

#### FavoritesService.js
- Favorite stalls management

---

## Backend APIs

### Backend Architecture
The system uses separate backend servers for Web and Mobile platforms:

**Backend-Web** (`Backend/Backend-Web/`)
- **Port:** 5000
- **Purpose:** Serves Web Portal (Admin/Management)
- **Base URL:** `/api/*`

**Backend-Mobile** (`Backend/Backend-Mobile/`)
- **Port:** 5001
- **Purpose:** Serves Mobile Application
- **Base URL:** `/api/mobile/*`

### Web API Routes (`/api/*`)

| Endpoint | Auth Required | Description |
|----------|---------------|-------------|
| `/api/health` | No | Server and database health check |
| `/api/auth/login` | No | Web login authentication |
| `/api/auth/logout` | Yes | Logout and session cleanup |
| `/api/auth/refresh` | Yes | Refresh JWT token |
| `/api/stalls` | Partial | Stall CRUD operations |
| `/api/stalls/images` | Yes | Stall image management |
| `/api/applications` | No | Public stall applications |
| `/api/landing-applicants` | No | Landing page submissions |
| `/api/employees` | Yes | Employee management |
| `/api/employees/sessions/active` | Yes | Active employee sessions |
| `/api/applicants` | Yes | Applicant management (admin) |
| `/api/branches` | Yes | Branch management |
| `/api/branches/:id/floors` | Yes | Floor management |
| `/api/branches/:id/sections` | Yes | Section management |
| `/api/stallholders` | Yes | Stallholder management |
| `/api/stallholders/import` | Yes | Excel import |
| `/api/stallholders/export` | Yes | Excel export |
| `/api/payments` | Yes | Payment processing |
| `/api/compliances` | Yes | Compliance tracking |
| `/api/complaints` | Yes | Complaint handling |
| `/api/subscriptions` | Yes | Subscription management |
| `/api/mobile-staff/inspectors` | Yes | Inspector management |
| `/api/mobile-staff/collectors` | Yes | Collector management |
| `/api/activity-logs` | Yes | Activity logging |
| `/api/raffles` | Yes | Raffle management |
| `/api/auctions` | Yes | Auction management |

### Mobile API Routes (`/api/mobile/*`)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `/api/mobile/auth/login` | No | Mobile login (inspector/collector/stallholder/vendor) |
| `/api/mobile/auth/refresh` | Yes | Refresh mobile JWT token |
| `/api/mobile/stalls` | Partial | Browse available stalls |
| `/api/mobile/applications` | No | Submit stall application |
| `/api/mobile/stallholder/profile` | Yes | Stallholder profile |
| `/api/mobile/stallholder/stalls` | Yes | Assigned stalls |
| `/api/mobile/stallholder/documents` | Yes | Document upload/management |
| `/api/mobile/stallholder/payments` | Yes | Payment history |
| `/api/mobile/inspector/stallholders` | Yes | List stallholders for inspection |
| `/api/mobile/inspector/stalls` | Yes | List stalls for inspection |
| `/api/mobile/inspector/report` | Yes | Submit violation report |
| `/api/mobile/inspector/reports` | Yes | View submitted reports |
| `/api/mobile/collector/collections` | Yes | Collection records |
| `/api/mobile/collector/payments` | Yes | Record payment |
| `/api/mobile/areas` | No | Available areas/branches |

### Health Check Endpoint
```bash
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "Server and database are healthy",
  "services": {
    "server": "running",
    "database": "connected",
    "dbResponseTime": "3247ms"
  }
}
```

### Authentication

#### Web Authentication
- **Method:** JWT tokens
- **Storage:** sessionStorage (browser)
- **Token Expiry:** 24 hours
- **Refresh Token:** 7 days
- **Password Hashing:** bcrypt (new) / SHA256 (legacy)

**Login Flow:**
```javascript
POST /api/auth/login
Body: { username, password }

Response: {
  success: true,
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  refreshToken: "...",
  user: {
    id, username, role, permissions, branch_id
  }
}
```

#### Mobile Authentication
- **Method:** JWT tokens
- **Storage:** AsyncStorage (React Native)
- **Token Expiry:** 24 hours
- **Refresh Token:** 7 days
- **Auto-login:** Enabled (token persistence)

**Login Flow:**
```javascript
POST /api/mobile/auth/login
Body: { username, password, user_type: 'inspector'|'collector'|'stallholder'|'vendor' }

Response: {
  success: true,
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  refreshToken: "...",
  user: {
    id, username, user_type, branch_id, name, email
  }
}
```

### File Upload Endpoints

#### Stall Images
```bash
POST /api/stalls/:id/images
Content-Type: multipart/form-data
Body: { image: [File] }

Max Size: 10MB
Formats: JPG, PNG
Storage: ./uploads/stalls/:stallId/
```

#### Applicant Documents
```bash
POST /api/applications/:id/documents
Content-Type: multipart/form-data
Body: { document: [File], document_type: string }

Max Size: 10MB
Formats: JPG, PNG, PDF
Storage: ./uploads/applicants/:applicantId/
```

#### Stallholder Documents
```bash
POST /api/mobile/stallholder/documents
Content-Type: multipart/form-data
Body: { document: [File], document_type_id: number }

Max Size: 10MB
Formats: JPG, PNG, PDF
Storage: ./uploads/stallholders/:stallholderId/
```

### Error Handling

#### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // Optional
}
```

#### Common Error Codes
| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication token missing/invalid |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `INVALID_CREDENTIALS` | Login failed |
| `DATABASE_ERROR` | Database connection/query error |
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Unique constraint violation |

---

## Database Structure

### Database: `naga_stall_digitalocean`
**Engine:** MySQL 8.0  
**Host:** AWS RDS (ap-southeast-1)  
**Timezone:** UTC (server), Philippine Time UTC+8 (application)  
**Collation:** utf8mb4_general_ci (standardized)

### Core Tables

#### User & Authentication
| Table | Description | Key Columns |
|-------|-------------|-------------|
| `stall_business_owner` | Business owner accounts | `id`, `username`, `email`, `subscription_status` |
| `business_manager` | Branch managers | `id`, `owner_id`, `username`, `last_login` |
| `business_employee` | Staff accounts with permissions | `id`, `username`, `permissions`, `last_login` |
| `credential` | Login credentials | `id`, `username`, `password`, `user_type`, `user_id` |
| `employee_session` | Active web sessions | `session_id`, `employee_id`, `employee_type`, `login_time`, `last_activity` |
| `staff_session` | Active mobile staff sessions | `session_id`, `staff_id`, `staff_type`, `login_time`, `last_activity` |
| `employee_password_reset` | Password reset tokens | `id`, `employee_id`, `token`, `expires_at` |

#### Branch & Location
| Table | Description | Key Columns |
|-------|-------------|-------------|
| `branch` | Branch/market locations | `id`, `owner_id`, `name`, `address`, `operating_hours` |
| `floor` | Floors within branches | `id`, `branch_id`, `floor_number`, `name` |
| `section` | Sections within floors | `id`, `floor_id`, `name`, `description` |
| `stall` | Individual stalls | `id`, `section_id`, `stall_number`, `status`, `monthly_rent` |
| `stall_images` | Stall photos | `id`, `stall_id`, `image_url`, `uploaded_at` |

#### Stallholders
| Table | Description | Key Columns |
|-------|-------------|-------------|
| `stallholder` | Stallholder accounts | `id`, `stall_id`, `first_name`, `last_name`, `email`, `phone` |
| `stallholder_documents` | Required documents | `id`, `branch_id`, `document_name`, `is_required` |
| `stallholder_document_submissions` | Submitted documents | `id`, `stallholder_id`, `document_id`, `file_path`, `status` |
| `spouse` | Spouse information | `id`, `stallholder_id`, `name`, `contact` |
| `other_information` | Additional details | `id`, `stallholder_id`, `notes` |
| `business_information` | Business details | `id`, `stallholder_id`, `business_name`, `business_type` |

#### Applications
| Table | Description | Key Columns |
|-------|-------------|-------------|
| `applicant` | Applicant information | `id`, `first_name`, `last_name`, `email`, `phone` |
| `applicant_documents` | Submitted documents | `id`, `applicant_id`, `document_type`, `file_path` |
| `application` | Stall applications | `id`, `applicant_id`, `branch_id`, `status`, `applied_date` |
| `stall_applications` | Application-stall mappings | `id`, `application_id`, `stall_id`, `priority` |

#### Payments
| Table | Description | Key Columns |
|-------|-------------|-------------|
| `payments` | Payment records | `id`, `stallholder_id`, `amount`, `payment_date`, `due_date`, `status` |
| `payment_status_log` | Payment status history | `id`, `payment_id`, `status`, `changed_at` |
| `subscription_payments` | Platform subscription payments | `id`, `owner_id`, `amount`, `payment_date`, `subscription_period` |
| `business_owner_subscriptions` | Subscription details | `id`, `owner_id`, `plan_type`, `start_date`, `end_date`, `status` |

#### Compliance & Inspections
| Table | Description | Key Columns |
|-------|-------------|-------------|
| `complaint` | Complaints/violations | `id`, `stallholder_id`, `stall_id`, `type`, `description`, `status`, `reported_by` |
| `inspector` | Inspector accounts | `id`, `username`, `password_hash`, `name`, `email`, `last_login`, `last_logout` |
| `inspector_assignment` | Inspector-branch assignments | `id`, `inspector_id`, `branch_id`, `assigned_date` |
| `inspector_action_log` | Inspector activities | `id`, `inspector_id`, `action_type`, `details`, `timestamp` |

#### Collections
| Table | Description | Key Columns |
|-------|-------------|-------------|
| `collector` | Collector accounts | `id`, `username`, `password_hash`, `name`, `email`, `last_login`, `last_logout` |
| `collector_assignment` | Collector-branch assignments | `id`, `collector_id`, `branch_id`, `assigned_date` |
| `collector_action_log` | Collector activities | `id`, `collector_id`, `action_type`, `details`, `timestamp` |

#### Raffle & Auction
| Table | Description | Key Columns |
|-------|-------------|-------------|
| `raffle` | Raffle events | `id`, `stall_id`, `title`, `start_date`, `end_date`, `status` |
| `raffle_participants` | Raffle entries | `id`, `raffle_id`, `applicant_id`, `entry_date` |
| `raffle_result` | Raffle winners | `id`, `raffle_id`, `winner_id`, `drawn_date` |
| `auction` | Auction events | `id`, `stall_id`, `title`, `starting_bid`, `start_date`, `end_date`, `status` |
| `auction_bids` | Auction bids | `id`, `auction_id`, `bidder_id`, `bid_amount`, `bid_time` |
| `auction_result` | Auction winners | `id`, `auction_id`, `winner_id`, `winning_bid`, `closed_date` |
| `raffle_auction_log` | Event logs | `id`, `event_type`, `event_id`, `action`, `timestamp` |

#### Activity Logging
| Table | Description | Key Columns |
|-------|-------------|-------------|
| `staff_activity_log` | Staff action logs | `id`, `staff_id`, `staff_type`, `action`, `details`, `timestamp` |
| `employee_activity_log` | Employee action logs | `id`, `employee_id`, `action`, `details`, `timestamp` |
| `employee_credential_log` | Credential changes | `id`, `employee_id`, `action`, `timestamp` |

### Key Relationships

```
stall_business_owner (1)
    │
    ├──(1:N)── business_manager (N)
    │            └── last_login (datetime, timezone-aware)
    │
    ├──(1:N)── business_employee (N)
    │            ├── permissions (JSON: dashboard, payments, stalls, etc.)
    │            └── last_login (datetime, timezone-aware)
    │
    ├──(1:N)── branch (N)
    │     │
    │     ├──(1:N)── floor (N)
    │     │     │
    │     │     └──(1:N)── section (N)
    │     │           │
    │     │           └──(1:N)── stall (N)
    │     │                 │
    │     │                 ├──(1:1)── stallholder (1)
    │     │                 │     │
    │     │                 │     ├──(1:N)── payments (N)
    │     │                 │     │     └── due_date, payment_date, status
    │     │                 │     │
    │     │                 │     └──(1:N)── stallholder_document_submissions (N)
    │     │                 │
    │     │                 ├──(1:N)── stall_images (N)
    │     │                 │
    │     │                 ├──(1:N)── raffle (N)
    │     │                 │     └──(1:N)── raffle_participants (N)
    │     │                 │
    │     │                 └──(1:N)── auction (N)
    │     │                       └──(1:N)── auction_bids (N)
    │     │
    │     ├──(1:N)── inspector_assignment (N)
    │     │           └──(N:1)── inspector (1)
    │     │                 ├── last_login (datetime)
    │     │                 └── last_logout (datetime)
    │     │
    │     └──(1:N)── collector_assignment (N)
    │                 └──(N:1)── collector (1)
    │                       ├── last_login (datetime)
    │                       └── last_logout (datetime)
    │
    └──(1:N)── business_owner_subscriptions (N)
          └── status, start_date, end_date
```

### Stored Procedures (Timezone-Aware)

All stored procedures have been updated to handle Philippine Time (UTC+8):

#### Session Management (Migration 327)
- `sp_createOrUpdateEmployeeSession` - Create/update web session for online status tracking
- `sp_updateEmployeeSessionActivity` - Update last activity timestamp
- `sp_endEmployeeSession` - End session on logout
- `sp_getActiveEmployeeSessions` - Get all active web sessions with employee info
- `sp_getActiveEmployeeSessionsByBranch` - Get active sessions filtered by branch
- `create_staff_session` - Create mobile staff session
- `end_staff_session` - End mobile staff session

#### Staff Activity Logging (Migration 323)
- `sp_insertStaffActivityLog` - Insert staff activity log entry
- `sp_getAllStaffActivities` - Get activities with filters (branch, type, date)
- `sp_countStaffActivities` - Count activities with filters
- `sp_getStaffActivityById` - Get activities for specific staff
- `sp_countStaffActivityById` - Count activities for specific staff
- `sp_getActivitySummaryByType` - Get activity summary grouped by staff type
- `sp_getActivitySummaryByAction` - Get top 10 action types
- `sp_getMostActiveStaff` - Get top 10 most active staff
- `sp_getRecentFailedActions` - Get recent failed actions
- `sp_clearAllActivityLogs` - Clear all activity logs

#### Payment Processing
- `sp_getOnsitePaymentsAll` / `sp_getOnsitePaymentsByBranches` - On-site payment queries
- `sp_getOnlinePaymentsAll` / `sp_getOnlinePaymentsByBranches` - Online payment queries
- `sp_approvePayment` / `sp_declinePayment` - Payment approval/rejection
- `sp_getPaymentStatsAll` / `sp_getPaymentStatsByBranches` - Payment statistics
- `process_payment` - Process payment with late fee/early discount calculation
- `calculate_late_fee` - Calculate late fees based on days overdue
- `apply_early_discount` - Apply 25% discount for early payments (5+ days)

#### Authentication (Migrations 307, 312, 314)
- `sp_getSystemAdminByUsername` - System admin login query
- `sp_getBusinessOwnerByUsername` - Business owner login query
- `sp_getBusinessManagerByUsername` - Business manager login query
- `sp_getBusinessEmployeeByUsername` - Business employee login query
- `sp_getInspectorByUsername` / `sp_getCollectorByUsername` - Mobile staff login
- `sp_storeRefreshToken` / `sp_getRefreshTokenByHash` - JWT refresh token management
- `sp_logStaffActivityLogin` / `sp_logStaffActivityLogout` - Activity logging
- `sp_update*LastLoginNow` - Update last login timestamps
- `sp_update*LastLogout` - Update last logout timestamps

#### Landing Page (Migration 324)
- `sp_getLandingPageStallsList` - Get stalls with search, filter, pagination
- `sp_getLandingPageStallholdersList` - Get stallholders with search, filter
- `sp_getLandingPageStats` - Get landing page statistics

#### Employee & Staff Management (Migrations 309, 310)
- `sp_getAllEmployeesAll` / `sp_getAllEmployeesByBranches` - Employee queries
- `sp_getEmployeeByIdWithBranch` - Get employee with branch info
- `sp_terminateEmployee` / `sp_logoutEmployee` - Employee termination/logout
- `sp_checkInspectorEmailExists` / `sp_checkCollectorEmailExists` - Email validation

#### Stallholder Management (Migration 313)
- `sp_getAllStallholdersAll` / `sp_getAllStallholdersByBranches` - Stallholder queries
- `sp_getFirstFloorByBranch` / `sp_getFirstSectionByFloor` - Location helpers

#### Branch & Role Permissions (Migration 311)
- `sp_getBranchIdForManager` - Get branch for manager
- `sp_getBranchIdForEmployee` - Get branch for employee
- `sp_getBranchIdsForOwner` - Get all branches for owner

#### Timezone Conversion
All procedures use `CONVERT_TZ(datetime, '+00:00', '+08:00')` for proper timezone handling.

### Database Fixes Applied

| Fix | File | Date | Description |
|-----|------|------|-------------|
| Timezone Sync | `FIX_TIMEZONE_SESSIONS.sql` | Dec 26, 2025 | Philippine time synchronization |
| Employee Status | `FIX_EMPLOYEE_ONLINE_STATUS.sql` | Dec 2025 | Session tracking procedures |
| Mobile Login | `FIX_MOBILE_LOGIN_AND_DASHBOARD.sql` | Jan 2, 2026 | Collation & password fixes |
| Collation | `fix-all-collations.js` | Dec 2025 | Standardized utf8mb4_general_ci |
| Password Reset | `RESET_STAFF_PASSWORDS.sql` | - | Reset staff passwords |

### Migration Files

Location: `database/migrations/`

Numbered migration files (001-328) for incremental database updates:

#### Core Tables (001-040)
- `001_addInspector.sql` - Inspector table creation
- `002_addOnsitePayment.sql` - On-site payment support
- `003_assignManagerToBusinessOwner.sql` - Manager assignments
- `004_CanCustomizeDocuments.sql` - Document customization
- `005-040` - Various table creation and updates

#### Stored Procedures - Authentication (307-315)
- `307_sp_mobileStaffAuth.sql` - Mobile staff authentication procedures
- `308_sp_paymentController.sql` - Payment operations procedures
- `309_sp_employeeController.sql` - Employee CRUD procedures
- `310_sp_mobileStaffController.sql` - Mobile staff management procedures
- `311_sp_rolePermissions.sql` - Branch filter operations
- `312_sp_enhancedAuth.sql` - Enhanced JWT authentication
- `313_sp_stallholderController.sql` - Stallholder operations
- `314_sp_unifiedAuthController.sql` - Unified authentication
- `315_sp_mobileAuthController.sql` - Mobile authentication

#### Stored Procedures - Features (316-328)
- `316_sp_landingPageStalls.sql` - Landing page stall queries
- `317_sp_mobileStallController.sql` - Mobile stall operations
- `318_sp_stallImageBlob.sql` - Stall image blob storage
- `319_sp_stallholderDocuments.sql` - Stallholder document management
- `320_sp_mobileLogin.sql` - Mobile login procedures
- `321_sp_inspectorController.sql` - Inspector operations
- `322_sp_mobileDocumentBlobController.sql` - Mobile document blobs
- `323_sp_staffActivityLog.sql` - Staff activity logging (9 procedures)
- `323_sp_remaining_raw_queries.sql` - Additional query conversions
- `324_fix_staff_activity_and_auto_logout.sql` - Staff activity table fixes
- `324_sp_landing_page_queries.sql` - Landing page stored procedures
- `325_sp_getFloorsSections.sql` - Floor/section queries
- `326_sp_mobileStallImageBlob.sql` - Mobile stall image blobs
- `327_sp_employeeSessionManagement.sql` - Employee session tracking (5 procedures)
- `328_fix_penalty_payment_recording.sql` - Penalty payment fixes

### Full Schema Export

Location: `database/naga_stall_digitalocean.sql`

Complete database schema with:
- ✅ All tables with indexes and constraints
- ✅ Stored procedures with timezone handling
- ✅ Sample data for testing
- ✅ User permissions setup

---

## User Roles & Permissions

### Role Hierarchy

```
System Administrator
        │
        └── Full platform access
             • Manage all business owners
             • View all subscriptions
             • Platform-wide reports

Stall Business Owner
        │
        ├── Full branch access
        │    • All modules
        │    • Branch management
        │    • Subscription management
        │
        └── Can create:
             • Business Managers
             • Business Employees
             • Inspectors
             • Collectors

Business Manager
        │
        ├── Branch management access
        │    • All modules except subscription/branch settings
        │
        └── Can manage:
             • Employees (limited)
             • Day-to-day operations

Business Employee
        │
        └── Permission-based access
             • Only assigned modules
             • No admin functions

Mobile Staff (Inspector/Collector)
        │
        └── Mobile app access only
             • Assigned branch operations
             • Field work functions
```

### Web Permission Types

| Permission | Allows Access To |
|------------|------------------|
| `dashboard` | Dashboard view |
| `applicants` | Applicant management |
| `complaints` | Complaint handling |
| `compliances` | Compliance & inspections |
| `vendors` | Vendor management |
| `stallholders` | Stallholder management |
| `collectors` | Collector management |
| `stalls` | Stall management, raffles, auctions |
| `payments` | Payment processing |

---

## Application Flow

### 1. Public Stall Application Flow

```
Landing Page
     │
     ▼
Browse Available Stalls
     │
     ▼
Select Stall to Apply
     │
     ▼
Fill Application Form
├── Personal Information
├── Business Information
├── Upload Required Documents
└── Submit Application
     │
     ▼
Application Received (Pending)
     │
     ▼
Staff Reviews Application
├── Verify Documents
├── Check Eligibility
└── Make Decision
     │
     ├── Approved ──► Create Stallholder Account
     │                      │
     │                      ▼
     │               Assign Stall
     │                      │
     │                      ▼
     │               Generate Credentials
     │                      │
     │                      ▼
     │               Stallholder Can Login (Web/Mobile)
     │
     └── Rejected ──► Notify Applicant (with reason)
```

### 2. Raffle/Auction Flow

```
Vacant Stall Identified
         │
         ▼
Staff Creates Raffle/Auction
├── Set dates
├── Set requirements
└── Publish
         │
         ▼
Applicants/Stallholders Join
├── Register interest
├── Submit required documents
└── (For auction) Place bids
         │
         ▼
Event Ends
         │
         ├── Raffle ──► Random draw
         │               │
         │               ▼
         │         Winner selected
         │
         └── Auction ──► Highest bidder wins
                          │
                          ▼
                    Winner selected
         │
         ▼
Stall Assigned to Winner
         │
         ▼
Winner becomes Stallholder (if new)
```

### 3. Payment Flow

```
Payment Due Date Approaches
         │
         ▼
System Calculates Amount
├── Monthly Rent
├── + Late Fee (if overdue)
│   └── Calculated based on days late
└── - Early Discount (if 5+ days early)
    └── 25% discount
         │
         ▼
Payment Collection
├── Mobile ──► Collector on-site
│               │
│               ▼
│         Record payment
│               │
│               ▼
│         Generate receipt
│
└── Web ──► Staff records payment
            │
            ▼
      Payment logged
            │
            ▼
      Stallholder notified
         │
         ▼
Update last_payment_date
         │
         ▼
Calculate next due date
```

### 4. Inspection/Compliance Flow

```
Inspector Assigned to Branch
         │
         ▼
Inspector Visits Stall
         │
         ▼
Conduct Inspection
├── Check compliance items
├── Note any violations
└── Take photos
         │
         ▼
File Report (Mobile App)
├── Select stallholder/stall
├── Select violation type
├── Add description
├── Attach photos
└── Submit
         │
         ▼
Report Received by System
         │
         ▼
Staff Reviews Report
├── Verify report
└── Take action if needed
         │
         ▼
Update Compliance Status
         │
         ▼
Stallholder Notified (if violation)
```

---

## Tech Stack

### Frontend - Web
| Technology | Purpose |
|------------|---------|
| Vue.js 3 | Frontend framework |
| Vuetify 3 | UI component library |
| Vue Router | Client-side routing |
| Pinia | State management |
| Vite | Build tool |
| Axios | HTTP client |

### Frontend - Mobile
| Technology | Purpose |
|------------|---------|
| React Native | Mobile framework |
| Expo | Development platform |
| React Navigation | Navigation library |
| AsyncStorage | Local storage |
| Ionicons | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 20 | Runtime environment |
| Express.js 4 | Web framework |
| MySQL 8 | Database (AWS RDS) |
| JWT | Authentication tokens |
| bcrypt | Password hashing (new) |
| SHA256 | Legacy password support |
| multer | File uploads |
| cors | Cross-origin requests |
| helmet | Security headers |
| compression | Response compression |
| express-rate-limit | API rate limiting |
| ExcelJS | Excel file generation/parsing |
| nodemailer | Email notifications |
| uuid | Unique identifiers |

### Infrastructure & DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Nginx | Reverse proxy & static files |
| DigitalOcean Droplet | Application hosting |
| AWS RDS MySQL | Database hosting |
| Git & GitHub | Version control |

### Development Tools
| Tool | Purpose |
|------|---------|
| VS Code | IDE |
| ESLint | Code linting |
| Prettier | Code formatting |
| Nodemon | Development auto-reload |
| MySQL Workbench | Database management |
| Postman | API testing |

---

## File Structure Summary

```
DigiStall-CP2025-2026/
│
├── Backend/
│   ├── Backend-Web/                  # Web API Server (Port 5000)
│   │   ├── server.js                 # Main entry point
│   │   ├── Dockerfile                # Docker build config
│   │   ├── package.json              # Dependencies
│   │   ├── .env                      # Environment variables
│   │   ├── config/
│   │   │   ├── database.js           # DB connection with retry logic
│   │   │   └── performanceMonitor.js # Performance tracking
│   │   ├── controllers/
│   │   │   ├── authController.js     # Web authentication
│   │   │   ├── stallController.js    # Stall operations
│   │   │   ├── paymentController.js  # Payment processing
│   │   │   ├── applicantController.js
│   │   │   ├── employeeController.js
│   │   │   └── employeeSessionController.js
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT authentication
│   │   │   └── errorHandler.js       # Error handling
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── stallRoutes.js
│   │   │   ├── paymentRoutes.js
│   │   │   └── ... (other routes)
│   │   ├── services/
│   │   │   └── (business logic)
│   │   ├── uploads/                  # File uploads storage
│   │   └── test-db-connection.js     # DB diagnostic tool
│   │
│   ├── Backend-Mobile/               # Mobile API Server (Port 5001)
│   │   ├── server.js                 # Main entry point
│   │   ├── Dockerfile                # Docker build config
│   │   ├── package.json              # Dependencies
│   │   ├── .env                      # Environment variables
│   │   ├── config/
│   │   │   └── database.js           # DB connection (timezone-aware)
│   │   ├── controllers/
│   │   │   ├── mobileStaffAuthController.js
│   │   │   ├── loginController.js    # Mobile login
│   │   │   ├── stallholderController.js
│   │   │   ├── inspectorController.js
│   │   │   └── collectorController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── stallholderRoutes.js
│   │   │   └── inspectorRoutes.js
│   │   └── services/
│   │
│   ├── config/                       # Shared config
│   │   ├── cors.js
│   │   └── database.js
│   ├── middleware/                   # Shared middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── uploads/                      # Shared uploads
│   │
│   └── Utility Scripts:
│       ├── check-columns.js          # Schema checker
│       ├── check-employee-status.js  # Session checker
│       ├── check-timezone.js         # Timezone validator
│       ├── final-timezone-fix.js     # Timezone fix script
│       ├── fix-all-collations.js     # Collation standardization
│       ├── fix-employee-sessions.js  # Session repair
│       ├── reset-passwords.js        # Password reset utility
│       ├── set-all-offline.cjs       # Force offline all users
│       └── test-login.js             # Login testing
│
├── Frontend/
│   ├── Web/                          # Vue.js Web Application
│   │   ├── Dockerfile                # Multi-stage build
│   │   ├── nginx.conf                # Nginx config for production
│   │   ├── package.json              # Dependencies
│   │   ├── vite.config.js            # Vite build config
│   │   ├── index.html                # Entry HTML
│   │   ├── src/
│   │   │   ├── main.js               # Vue app entry
│   │   │   ├── App.vue               # Root component
│   │   │   ├── components/
│   │   │   │   ├── LandingPage/      # Public landing page
│   │   │   │   │   ├── header/
│   │   │   │   │   ├── stalls/
│   │   │   │   │   ├── vendor/
│   │   │   │   │   ├── compliance/
│   │   │   │   │   └── footer/
│   │   │   │   ├── Admin/            # Business management
│   │   │   │   │   ├── Dashboard/
│   │   │   │   │   ├── Stalls/
│   │   │   │   │   │   ├── StallImageManager.vue
│   │   │   │   │   │   └── Raffles/Auctions/
│   │   │   │   │   ├── Stallholders/
│   │   │   │   │   │   └── StallholderImport.vue
│   │   │   │   │   ├── Payments/
│   │   │   │   │   ├── Applicants/
│   │   │   │   │   ├── Compliance/
│   │   │   │   │   ├── Complaints/
│   │   │   │   │   ├── Employees/
│   │   │   │   │   ├── Branch/
│   │   │   │   │   └── Subscription/
│   │   │   │   ├── SystemAdmin/      # Platform admin
│   │   │   │   │   ├── Dashboard/
│   │   │   │   │   ├── BusinessOwners/
│   │   │   │   │   ├── Payments/
│   │   │   │   │   └── Reports/
│   │   │   │   ├── MainLayout/       # Layout components
│   │   │   │   │   ├── AppNavbar.vue
│   │   │   │   │   ├── Sidebar.vue
│   │   │   │   │   └── Footer.vue
│   │   │   │   └── Common/           # Shared components
│   │   │   ├── router/               # Vue Router config
│   │   │   │   └── index.js
│   │   │   ├── stores/               # Pinia stores
│   │   │   │   ├── auth.js
│   │   │   │   └── app.js
│   │   │   ├── services/             # API services
│   │   │   │   ├── api.js
│   │   │   │   ├── authService.js
│   │   │   │   └── stallService.js
│   │   │   └── assets/               # Static assets
│   │   │       ├── images/
│   │   │       └── styles/
│   │   └── public/
│   │
│   └── Mobile/                       # React Native Mobile App
│       ├── App.js                    # Entry point
│       ├── app.json                  # Expo config
│       ├── package.json              # Dependencies
│       ├── babel.config.js
│       ├── screens/
│       │   ├── LoginScreen/          # Authentication
│       │   │   └── LoginScreen.js
│       │   ├── LoadingScreen/        # Loading states
│       │   │   └── LoadingScreen.js
│       │   ├── StallHolder/          # Stallholder module
│       │   │   ├── StallHome.js
│       │   │   ├── TabbedStallScreen.js
│       │   │   ├── DocumentsScreen.js
│       │   │   ├── PaymentScreen.js
│       │   │   └── SettingsScreen.js
│       │   ├── Inspector/            # Inspector module
│       │   │   ├── InspectorHome.js
│       │   │   ├── StallholdersScreen.js
│       │   │   ├── StallsScreen.js
│       │   │   ├── ReportScreen.js
│       │   │   └── DashboardScreen.js
│       │   ├── Collector/            # Collector module
│       │   │   ├── CollectorHome.js
│       │   │   ├── ProfileScreen.js
│       │   │   └── SettingsScreen.js
│       │   └── Vendor/               # Vendor module
│       │       └── VendorHome.js
│       ├── services/                 # API & storage
│       │   ├── ApiService.js
│       │   ├── UserStorageService.js
│       │   └── FavoritesService.js
│       └── assets/                   # Images & resources
│           ├── images/
│           └── icons/
│
├── database/                         # Database scripts
│   ├── naga_stall_digitalocean.sql   # Full schema export
│   ├── FIX_TIMEZONE_SESSIONS.sql     # Timezone fix
│   ├── FIX_EMPLOYEE_ONLINE_STATUS.sql # Session tracking
│   ├── FIX_MOBILE_LOGIN_AND_DASHBOARD.sql # Mobile fixes
│   ├── RESET_STAFF_PASSWORDS.sql     # Password reset
│   ├── SET_TIMEZONE.sql              # Timezone setup
│   └── migrations/                   # Incremental migrations
│       ├── 001_addInspector.sql
│       ├── 002_addOnsitePayment.sql
│       └── ... (numbered migrations)
│
├── docs/                             # Documentation
│   ├── FULL_SYSTEM_DOCUMENTATION.md  # This file
│   ├── FIXES_APPLIED.md              # Recent fixes log
│   ├── DATABASE_PERFORMANCE_GUIDE.md
│   ├── DIGITALOCEAN_DEPLOYMENT.md
│   ├── DIGITALOCEAN_CONNECTION_TROUBLESHOOTING.md
│   ├── STALL_IMAGE_MANAGEMENT_GUIDE.md
│   ├── STALLHOLDER_EXCEL_IMPORT_GUIDE.md
│   ├── STORED_PROCEDURE_MIGRATION_STATUS.md
│   └── APPLICATION_FLOW_ANALYSIS.md
│
├── uploads/                          # File uploads (shared volume)
│   ├── stalls/
│   │   └── [stallId]/
│   ├── applicants/
│   │   └── [applicantId]/
│   └── stallholders/
│       └── [stallholderId]/
│
├── .env                              # Root environment config
├── .env.example                      # Environment template
├── docker-compose.yml                # Docker orchestration
├── Start-all.ps1                     # Windows startup script
├── deploy-to-droplet.sh              # Deployment script
├── DOCKER-README.md                  # Docker guide
├── DROPLET_DEPLOYMENT_GUIDE.md       # Deployment guide
├── TIMEZONE_FIX_SUMMARY.md           # Timezone fix notes
├── EMPLOYEE_ONLINE_STATUS_FIX_README.md
├── FIX_MOBILE_LOGIN_README.md
└── QUICK_FIX_GUIDE.txt               # Quick reference
```

---

## Quick Start Guide

### Prerequisites
- Docker Desktop installed and running
- Git installed
- MySQL Workbench (for database management)
- Node.js 20+ (for local development)
- Expo Go app (for mobile testing)

### Option 1: Docker Deployment (Recommended)

#### 1. Clone the Repository
```bash
git clone https://github.com/digistall/DigiStall-CP2025-2026.git
cd DigiStall-CP2025-2026
```

#### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database credentials
# DB_HOST=db.cjunttcqcwlh.ap-southeast-1.rds.amazonaws.com
# DB_USER=admin
# DB_PASSWORD=your_password
# DB_NAME=naga_stall_digitalocean
```

#### 3. Start All Services
```bash
docker-compose up --build -d
```

#### 4. Verify Services
```bash
# Check running containers
docker-compose ps

# Check health
curl http://localhost/api/health

# View logs
docker-compose logs -f
```

#### 5. Access Applications
- **Web Portal:** http://localhost
- **API Health:** http://localhost/api/health
- **Backend Web:** http://localhost:5000
- **Backend Mobile:** http://localhost:5001

---

### Option 2: Local Development

#### 1. Setup Database
```bash
# Import database schema
mysql -h [host] -u [user] -p naga_stall_digitalocean < database/naga_stall_digitalocean.sql

# Apply latest fixes
mysql -h [host] -u [user] -p naga_stall_digitalocean < database/FIX_TIMEZONE_SESSIONS.sql
mysql -h [host] -u [user] -p naga_stall_digitalocean < database/FIX_EMPLOYEE_ONLINE_STATUS.sql
mysql -h [host] -u [user] -p naga_stall_digitalocean < database/FIX_MOBILE_LOGIN_AND_DASHBOARD.sql
```

#### 2. Start Backend Web
```bash
cd Backend/Backend-Web
npm install
cp .env.example .env
# Edit .env with your database credentials
npm start
# Server runs on http://localhost:5000
```

#### 3. Start Backend Mobile
```bash
cd Backend/Backend-Mobile
npm install
cp .env.example .env
# Edit .env with your database credentials
npm start
# Server runs on http://localhost:5001
```

#### 4. Start Web Frontend
```bash
cd Frontend/Web
npm install
npm run dev
# Opens on http://localhost:5173
```

#### 5. Start Mobile App
```bash
cd Frontend/Mobile
npm install
npx expo start
# Scan QR code with Expo Go app
```

---

### Option 3: Deploy to DigitalOcean

#### 1. Create Droplet
- **Size:** 4GB RAM, 2 vCPUs, 80GB Disk ($20/month)
- **OS:** Ubuntu 22.04 LTS
- **Region:** Singapore (ap-southeast-1)

#### 2. Connect to Droplet
```bash
ssh root@YOUR_DROPLET_IP
```

#### 3. Run Deployment Script
```bash
curl -fsSL https://raw.githubusercontent.com/digistall/DigiStall-CP2025-2026/main/deploy-to-droplet.sh | bash
```

#### 4. Configure Environment
```bash
cd /opt/digistall
nano .env
# Update database credentials
```

#### 5. Start Services
```bash
docker-compose up --build -d
```

See `DROPLET_DEPLOYMENT_GUIDE.md` for detailed instructions.

---

### Default Credentials

#### System Administrator
- Username: `sysadmin`
- Password: (set during setup)

#### Business Owner (Test Account)
- Username: `owner1`
- Password: `password123`

#### Inspector (Mobile)
- Username: `inspector1`
- Password: `password123`

#### Collector (Mobile)
- Username: `collector1`
- Password: `password123`

**⚠️ IMPORTANT:** Change all default passwords in production!

---

### Post-Installation Checklist

- [ ] Database imported successfully
- [ ] All timezone fixes applied
- [ ] Docker containers running
- [ ] Health endpoint responding
- [ ] Web portal accessible
- [ ] Mobile API responding
- [ ] Test login successful
- [ ] File uploads working
- [ ] Session tracking active
- [ ] Default passwords changed

---

## Recent Fixes & Improvements

### Critical Fixes Applied (Dec 2025 - Jan 2026)

#### 1. ⏰ Timezone Synchronization Fix (Dec 26, 2025)
**Problem:** Database stores UTC time, but Philippine Time (UTC+8) needed for display.

**Solutions Implemented:**
- ✅ Added timezone handling in database connection settings
- ✅ Updated all stored procedures to use Philippine timezone
- ✅ Fixed `last_login` column displays (was showing 8 hours behind)
- ✅ Added frontend formatters for proper time display
- ✅ Created `database-time-checker.html` for diagnostics

**Files Modified:**
- `Backend/Backend-Mobile/config/database.js` - Added timezone: '+08:00'
- `database/FIX_TIMEZONE_SESSIONS.sql` - Updated stored procedures
- Multiple frontend formatters

**Reference:** `TIMEZONE_FIX_SUMMARY.md`

---

#### 2. 👮 Employee/Staff Online Status Fix (Dec 2025)
**Problem:** 500 error on `/api/employees/sessions/active` - stored procedures missing.

**Solutions Implemented:**
- ✅ Created `staff_session` table for inspector/collector tracking
- ✅ Updated session stored procedures with timezone fixes
- ✅ Added proper session tracking for mobile staff (inspectors/collectors)
- ✅ Fixed employee redirect when no dashboard permission
- ✅ Implemented proper JWT permission caching

**Files Modified:**
- `database/FIX_EMPLOYEE_ONLINE_STATUS.sql` - Created procedures
- `Backend/Backend-Web/controllers/employeeSessionController.js`
- Frontend employee management components

**Reference:** `EMPLOYEE_ONLINE_STATUS_FIX_README.md`

---

#### 3. 📱 Mobile Login & Dashboard Fix (Jan 2, 2026)
**Problem:** Multiple database schema issues causing login failures.

**Solutions Implemented:**
- ✅ Fixed "Unknown column 'i.password_hash'" - Added COALESCE fallback
- ✅ Fixed "Unknown column 'c.applicant_email'" - Removed invalid reference
- ✅ Resolved collation conflicts (utf8mb4_general_ci vs utf8mb4_0900_ai_ci)
- ✅ Added `last_logout` column to inspector/collector tables
- ✅ Implemented dual password verification (bcrypt + SHA256 legacy)
- ✅ Fixed staff session mapping with correct `user_id` and `user_type`

**Files Modified:**
- `Backend/Backend-Mobile/controllers/mobileStaffAuthController.js`
- `Backend/Backend-Web/controllers/loginController.js`
- `database/FIX_MOBILE_LOGIN_AND_DASHBOARD.sql`

**Reference:** `FIX_MOBILE_LOGIN_README.md`

---

#### 4. 🌐 DigitalOcean Database Connection Fix (Dec 2025)
**Problem:** System loading forever, "Server shutdown in progress" errors.

**Solutions Implemented:**
- ✅ Updated `.env` with correct AWS RDS credentials
- ✅ Added connection retry logic (3 attempts, 2-second delays)
- ✅ Optimized connection pool from 10 to 5 for cloud database
- ✅ Implemented connection keep-alive settings
- ✅ Added 60-second connection timeout
- ✅ Created performance monitoring tools
- ✅ Non-blocking database initialization

**Files Modified:**
- `Backend/Backend-Web/config/database.js` - Retry & timeout logic
- `Backend/Backend-Web/server.js` - Non-blocking init
- `Backend/Backend-Web/config/performanceMonitor.js` - NEW
- `Backend/Backend-Web/test-db-connection.js` - NEW

**Performance Metrics:**
- Initial connection: ~3 seconds (cloud latency)
- Subsequent queries: <500ms
- Connection pool: 5 concurrent

**References:** 
- `docs/FIXES_APPLIED.md`
- `docs/DATABASE_PERFORMANCE_GUIDE.md`
- `docs/DIGITALOCEAN_CONNECTION_TROUBLESHOOTING.md`

---

#### 5. 📸 Stall Image Management Enhancement
**Problem:** Inefficient stall image handling and management.

**Solutions Implemented:**
- ✅ Integrated StallImageManager component
- ✅ Image upload with preview
- ✅ Multi-image support per stall
- ✅ Image deletion functionality
- ✅ Responsive image gallery

**Reference:** `docs/STALL_IMAGE_MANAGEMENT_GUIDE.md`

---

#### 6. 📊 Stallholder Excel Import/Export
**Problem:** Manual data entry for bulk stallholder operations.

**Solutions Implemented:**
- ✅ Excel template for stallholder import
- ✅ Bulk import with validation
- ✅ Export stallholder data to Excel
- ✅ Error handling and reporting

**Reference:** `docs/STALLHOLDER_EXCEL_IMPORT_GUIDE.md`

---

#### 7. 🔄 Stored Procedure Migration (Ongoing - Jan 2026)
**Status:** Major progress - 20+ migration files completed with 100+ stored procedures.

**Completed Migrations:**
- ✅ `307_sp_mobileStaffAuth.sql` - Mobile staff authentication (9 procedures)
- ✅ `308_sp_paymentController.sql` - Payment operations (8 procedures)
- ✅ `309_sp_employeeController.sql` - Employee CRUD operations
- ✅ `310_sp_mobileStaffController.sql` - Mobile staff management
- ✅ `311_sp_rolePermissions.sql` - Branch filter operations
- ✅ `312_sp_enhancedAuth.sql` - Enhanced JWT authentication (15+ procedures)
- ✅ `313_sp_stallholderController.sql` - Stallholder operations
- ✅ `314_sp_unifiedAuthController.sql` - Unified authentication
- ✅ `315_sp_mobileAuthController.sql` - Mobile authentication
- ✅ `316_sp_landingPageStalls.sql` - Landing page queries
- ✅ `317_sp_mobileStallController.sql` - Mobile stall operations
- ✅ `318-319` - Document blob storage procedures
- ✅ `320_sp_mobileLogin.sql` - Mobile login procedures
- ✅ `321_sp_inspectorController.sql` - Inspector operations
- ✅ `322_sp_mobileDocumentBlobController.sql` - Mobile document blobs
- ✅ `323_sp_staffActivityLog.sql` - Staff activity logging (9 procedures)
- ✅ `324_sp_landing_page_queries.sql` - Landing page stored procedures
- ✅ `325_sp_getFloorsSections.sql` - Floor/section queries
- ✅ `326_sp_mobileStallImageBlob.sql` - Mobile stall image blobs
- ✅ `327_sp_employeeSessionManagement.sql` - Employee session tracking (5 procedures)

**Reference:** `docs/STORED_PROCEDURE_MIGRATION_STATUS.md`

---

#### 8. 📝 Staff Activity Logging System (Jan 5, 2026)
**Problem:** Need comprehensive tracking of all staff activities.

**Solutions Implemented:**
- ✅ Created `staff_activity_log` table with complete audit fields
- ✅ Implemented 9 stored procedures for activity management
- ✅ Support for filtering by branch, staff type, date range
- ✅ Activity summary reports by staff type and action
- ✅ Failed action tracking for security auditing
- ✅ Auto-logout logging for session management

**Stored Procedures Created:**
- `sp_insertStaffActivityLog` - Insert activity log entry
- `sp_getAllStaffActivities` - Get activities with filters
- `sp_countStaffActivities` - Count activities for pagination
- `sp_getStaffActivityById` - Get specific staff activities
- `sp_getActivitySummaryByType` - Summary by staff type
- `sp_getActivitySummaryByAction` - Top 10 actions
- `sp_getMostActiveStaff` - Top 10 active staff
- `sp_getRecentFailedActions` - Recent failed actions
- `sp_clearAllActivityLogs` - Clear all logs

**Files:** `database/migrations/323_sp_staffActivityLog.sql`, `324_fix_staff_activity_and_auto_logout.sql`

---

#### 9. 👥 Employee Session Management Enhancement (Jan 5, 2026)
**Problem:** Need better employee online status tracking and session management.

**Solutions Implemented:**
- ✅ Created comprehensive session tracking procedures
- ✅ Support for creating/updating sessions
- ✅ Activity timestamp updates
- ✅ Session termination on logout
- ✅ Active session queries (all and by branch)

**Stored Procedures Created:**
- `sp_createOrUpdateEmployeeSession` - Create/update session
- `sp_updateEmployeeSessionActivity` - Update last activity
- `sp_endEmployeeSession` - End session on logout
- `sp_getActiveEmployeeSessions` - Get all active sessions
- `sp_getActiveEmployeeSessionsByBranch` - Filter by branch

**File:** `database/migrations/327_sp_employeeSessionManagement.sql`

---

### Known Issues & Limitations

1. **JWT Permission Updates**
   - Employees must log out and back in after permission changes
   - This is standard JWT behavior (tokens cache permissions)

2. **Database Timezone**
   - Server stores UTC, app converts to Philippine Time
   - Ensure all stored procedures use `CONVERT_TZ()` function

3. **Mobile App Build**
   - Requires Expo Go app for development
   - Production build requires Expo EAS Build service

4. **File Upload Limits**
   - Maximum file size: 10MB per file
   - Supported formats: JPG, PNG, PDF

---

## Troubleshooting & Support

### Common Issues & Solutions

#### "Server shutdown in progress" Error
```bash
# Check database connection
cd Backend/Backend-Web
node test-db-connection.js

# Verify .env configuration
cat .env | grep DB_

# Restart backend
docker-compose restart backend-web
```

#### Employee Shows "Offline" When Recently Logged In
```bash
# Run timezone fix SQL
mysql -h [host] -u [user] -p [database] < database/FIX_TIMEZONE_SESSIONS.sql

# Clear browser cache
Ctrl + Shift + R (Chrome/Edge)

# Ask employee to log in again
```

#### Mobile Login Fails
```bash
# Apply mobile login fixes
mysql -h [host] -u [user] -p [database] < database/FIX_MOBILE_LOGIN_AND_DASHBOARD.sql

# Check collation in database
mysql> SELECT COLUMN_NAME, COLLATION_NAME 
       FROM information_schema.COLUMNS 
       WHERE TABLE_NAME='credential';
```

#### Docker Container Won't Start
```bash
# Check logs
docker-compose logs backend-web
docker-compose logs backend-mobile

# Rebuild containers
docker-compose down
docker-compose up --build -d

# Check disk space
df -h
```

### Support Resources

| Resource | Location |
|----------|----------|
| Full Documentation | `docs/FULL_SYSTEM_DOCUMENTATION.md` |
| Database Performance | `docs/DATABASE_PERFORMANCE_GUIDE.md` |
| DigitalOcean Deploy | `DROPLET_DEPLOYMENT_GUIDE.md` |
| Docker Guide | `DOCKER-README.md` |
| Timezone Fix | `TIMEZONE_FIX_SUMMARY.md` |
| Employee Status Fix | `EMPLOYEE_ONLINE_STATUS_FIX_README.md` |
| Mobile Login Fix | `FIX_MOBILE_LOGIN_README.md` |
| Quick Fix Guide | `QUICK_FIX_GUIDE.txt` |

### Database Management

#### Backup Database
```bash
# From local
mysqldump -h db.cjunttcqcwlh.ap-southeast-1.rds.amazonaws.com \
  -u admin -p naga_stall_digitalocean > backup_$(date +%Y%m%d).sql

# From droplet
ssh root@68.183.154.125
mysqldump -h db.cjunttcqcwlh.ap-southeast-1.rds.amazonaws.com \
  -u admin -p naga_stall_digitalocean > /backup/backup_$(date +%Y%m%d).sql
```

#### Run Database Migrations
```bash
# Apply specific fix
mysql -h db.cjunttcqcwlh.ap-southeast-1.rds.amazonaws.com \
  -u admin -p naga_stall_digitalocean < database/FIX_TIMEZONE_SESSIONS.sql

# Apply all migrations
for file in database/migrations/*.sql; do
  mysql -h [host] -u admin -p naga_stall_digitalocean < "$file"
done
```

#### Reset Passwords
```bash
# Reset all staff passwords to default
mysql -h [host] -u admin -p naga_stall_digitalocean \
  < database/RESET_STAFF_PASSWORDS.sql
```

---

## Contact & Support

- **System:** Naga City Stall Management System (DigiStall)
- **Version:** 1.0.1
- **Status:** Production Ready
- **Production URL:** http://68.183.154.125
- **API Health:** http://68.183.154.125/api/health

---

*Documentation last updated: January 5, 2026*
