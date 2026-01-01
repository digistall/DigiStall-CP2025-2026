# DigiStall - Naga City Stall Management System
## Complete System Documentation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Landing Page (Public Website)](#landing-page-public-website)
4. [Web Portal (Admin/Management)](#web-portal-adminmanagement)
5. [Mobile Application](#mobile-application)
6. [Backend APIs](#backend-apis)
7. [Database Structure](#database-structure)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Application Flow](#application-flow)
10. [Tech Stack](#tech-stack)

---

## System Overview

**DigiStall** is a comprehensive Stall Management System designed for Naga City. It provides a complete solution for managing market stalls, stallholders, payments, compliance, and inspections across multiple branches.

### Key Features
- 🏪 **Stall Management** - Track and manage stalls across multiple branches
- 👥 **Stallholder Management** - Register and manage stallholders
- 💰 **Payment Processing** - Track rent payments, late fees, and early discounts
- 📋 **Compliance & Inspections** - Monitor compliance and conduct inspections
- 🎲 **Raffle & Auction System** - Allocate vacant stalls through raffles and auctions
- 📱 **Mobile Application** - For stallholders, inspectors, collectors, and vendors
- 🔐 **Role-Based Access Control** - Multiple user types with specific permissions

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DIGISTALL SYSTEM                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐ │
│  │  LANDING    │    │    WEB      │    │       MOBILE APP        │ │
│  │   PAGE      │    │   PORTAL    │    │                         │ │
│  │  (Public)   │    │  (Admin)    │    │  ┌────┐ ┌────┐ ┌────┐  │ │
│  │             │    │             │    │  │Stall│ │Insp│ │Coll│  │ │
│  │ • View      │    │ • Dashboard │    │  │hold-│ │ect-│ │ect-│  │ │
│  │   Stalls    │    │ • Manage    │    │  │ er  │ │ or │ │ or │  │ │
│  │ • Apply     │    │   Stalls    │    │  └────┘ └────┘ └────┘  │ │
│  │   for       │    │ • Payments  │    │                         │ │
│  │   Stalls    │    │ • Reports   │    │  ┌────┐                 │ │
│  │             │    │             │    │  │Vend│                 │ │
│  │             │    │             │    │  │ or │                 │ │
│  └──────┬──────┘    └──────┬──────┘    │  └────┘                 │ │
│         │                  │           └───────────┬─────────────┘ │
│         │                  │                       │               │
│         └──────────────────┼───────────────────────┘               │
│                            │                                       │
│                            ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    UNIFIED BACKEND                           │  │
│  │                                                              │  │
│  │  ┌──────────────────┐      ┌──────────────────┐             │  │
│  │  │  Backend-Web     │      │  Backend-Mobile  │             │  │
│  │  │  (Port 3001)     │      │  (Port 5001)     │             │  │
│  │  │                  │      │                  │             │  │
│  │  │  /api/auth       │      │  /api/mobile/    │             │  │
│  │  │  /api/stalls     │      │    auth          │             │  │
│  │  │  /api/payments   │      │    stalls        │             │  │
│  │  │  /api/branches   │      │    stallholder   │             │  │
│  │  │  /api/complaints │      │    inspector     │             │  │
│  │  └──────────────────┘      └──────────────────┘             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                            │                                       │
│                            ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    MySQL DATABASE                            │  │
│  │                    (naga_stall)                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
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

### Unified Backend Server
**Location:** `Backend/server.js`

The system uses a unified backend that serves both Web and Mobile APIs.

### Web API Routes (`/api/*`)

| Endpoint | Auth Required | Description |
|----------|---------------|-------------|
| `/api/auth` | No | Authentication (login, register) |
| `/api/stalls` | Partial | Stall management |
| `/api/applications` | No | Stall applications |
| `/api/landing-applicants` | No | Landing page submissions |
| `/api/employees` | Partial | Employee management |
| `/api/applicants` | Yes | Applicant management |
| `/api/branches` | Yes | Branch management |
| `/api/stallholders` | Yes | Stallholder management |
| `/api/payments` | Yes | Payment processing |
| `/api/compliances` | Yes | Compliance tracking |
| `/api/complaints` | Yes | Complaint handling |
| `/api/subscriptions` | Yes | Subscription management |
| `/api/mobile-staff` | Yes | Inspector/Collector management |
| `/api/activity-logs` | Yes | Activity logging |

### Mobile API Routes (`/api/mobile/*`)

| Endpoint | Description |
|----------|-------------|
| `/api/mobile/auth` | Mobile authentication |
| `/api/mobile/stalls` | Stall browsing |
| `/api/mobile/applications` | Application submission |
| `/api/mobile/stallholder` | Stallholder document management |
| `/api/mobile/inspector` | Inspector operations |
| `/api/mobile/areas` | Available areas listing |

### Health Check Endpoint
```
GET /api/health
Response: {
  success: true,
  message: "Server and database are healthy",
  services: {
    server: "running",
    database: "connected",
    dbResponseTime: "XXms"
  }
}
```

### Authentication

#### Web Authentication
- Session-based authentication with JWT
- Token stored in sessionStorage
- Role and permission checking on routes

#### Mobile Authentication
- JWT tokens with refresh mechanism
- Secure token storage (AsyncStorage)
- Auto-login on app restart

---

## Database Structure

### Database: `naga_stall`

### Core Tables

#### User & Authentication
| Table | Description |
|-------|-------------|
| `stall_business_owner` | Business owner accounts |
| `business_manager` | Branch managers |
| `business_employee` | Staff accounts with permissions |
| `credential` | Login credentials |
| `employee_session` | Active sessions |
| `employee_password_reset` | Password reset tokens |

#### Branch & Location
| Table | Description |
|-------|-------------|
| `branch` | Branch/market locations |
| `floor` | Floors within branches |
| `section` | Sections within floors |
| `stall` | Individual stalls |
| `stall_images` | Stall photos |

#### Stallholders
| Table | Description |
|-------|-------------|
| `stallholder` | Stallholder accounts |
| `stallholder_documents` | Required documents |
| `stallholder_document_submissions` | Submitted documents |
| `spouse` | Spouse information |
| `other_information` | Additional details |
| `business_information` | Business details |

#### Applications
| Table | Description |
|-------|-------------|
| `applicant` | Applicant information |
| `applicant_documents` | Submitted documents |
| `application` | Stall applications |
| `stall_applications` | Application-stall mappings |

#### Payments
| Table | Description |
|-------|-------------|
| `payments` | Payment records |
| `payment_status_log` | Payment status history |
| `subscription_payments` | Platform subscription payments |
| `business_owner_subscriptions` | Subscription details |

#### Compliance & Inspections
| Table | Description |
|-------|-------------|
| `complaint` | Complaints/violations |
| `inspector` | Inspector accounts |
| `inspector_assignment` | Inspector-branch assignments |
| `inspector_action_log` | Inspector activities |

#### Collections
| Table | Description |
|-------|-------------|
| `collector` | Collector accounts |
| `collector_assignment` | Collector-branch assignments |
| `collector_action_log` | Collector activities |

#### Raffle & Auction
| Table | Description |
|-------|-------------|
| `raffle` | Raffle events |
| `raffle_participants` | Raffle entries |
| `raffle_result` | Raffle winners |
| `auction` | Auction events |
| `auction_bids` | Auction bids |
| `auction_result` | Auction winners |
| `raffle_auction_log` | Event logs |

#### Activity Logging
| Table | Description |
|-------|-------------|
| `staff_activity_log` | Staff action logs |
| `employee_activity_log` | Employee action logs |
| `employee_credential_log` | Credential changes |

### Key Relationships

```
stall_business_owner
    │
    ├── business_owner_managers ──► business_manager
    │
    ├── branch
    │     │
    │     ├── floor
    │     │     │
    │     │     └── section
    │     │           │
    │     │           └── stall
    │     │                 │
    │     │                 ├── stallholder
    │     │                 │     │
    │     │                 │     └── payments
    │     │                 │
    │     │                 ├── raffle
    │     │                 │
    │     │                 └── auction
    │     │
    │     ├── inspector_assignment ──► inspector
    │     │
    │     └── collector_assignment ──► collector
    │
    └── business_employee
```

### Stored Procedures
The database includes numerous stored procedures for:
- Adding inspectors/collectors
- Processing payments (with late fees/early discounts)
- Managing applications
- Compliance checking
- Stall availability checking
- Creating stallholders from applications

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
| Node.js | Runtime environment |
| Express.js | Web framework |
| MySQL | Database |
| JWT | Authentication |
| bcrypt/SHA256 | Password hashing |
| multer | File uploads |
| cors | Cross-origin requests |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Nginx | Reverse proxy & static files |
| DigitalOcean | Cloud hosting |

### Development Tools
| Tool | Purpose |
|------|---------|
| VS Code | IDE |
| Git | Version control |
| ESLint | Code linting |
| Prettier | Code formatting |

---

## File Structure Summary

```
DigiStall-CP2025-2026/
│
├── Backend/
│   ├── server.js                 # Unified backend entry point
│   ├── Backend-Web/              # Web-specific backend
│   │   ├── server.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   │
│   ├── Backend-Mobile/           # Mobile-specific backend
│   │   ├── server.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   │
│   ├── config/                   # Shared config
│   └── middleware/               # Shared middleware
│
├── Frontend/
│   ├── Web/                      # Vue.js web application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── LandingPage/  # Public landing page
│   │   │   │   ├── Admin/        # Business management
│   │   │   │   ├── SystemAdmin/  # Platform admin
│   │   │   │   ├── MainLayout/   # Layout components
│   │   │   │   └── Common/       # Shared components
│   │   │   ├── router/           # Vue Router config
│   │   │   ├── stores/           # Pinia stores
│   │   │   ├── services/         # API services
│   │   │   └── assets/           # Static assets
│   │   └── public/
│   │
│   └── Mobile/                   # React Native mobile app
│       ├── App.js                # Entry point
│       ├── screens/
│       │   ├── LoginScreen/      # Authentication
│       │   ├── LoadingScreen/    # Loading states
│       │   ├── StallHolder/      # Stallholder module
│       │   ├── Inspector/        # Inspector module
│       │   ├── Collector/        # Collector module
│       │   └── Vendor/           # Vendor module
│       ├── services/             # API & storage services
│       └── assets/               # Images & resources
│
├── database/
│   ├── naga_stall_digitalocean.sql  # Full database schema
│   └── migrations/                   # Database migrations
│
├── docs/                         # Documentation
│
├── nginx/                        # Nginx configuration
│
├── uploads/                      # File uploads directory
│
├── docker-compose.yml            # Docker orchestration
├── Start-all.ps1                 # Windows startup script
└── deploy-to-droplet.sh          # Deployment script
```

---

## Quick Start Guide

### Local Development

1. **Start Database**
   ```bash
   # Start MySQL/MariaDB
   # Import database/naga_stall_digitalocean.sql
   ```

2. **Start Backend**
   ```bash
   cd Backend
   npm install
   npm start
   # Server runs on port 3001 (web) and 5001 (mobile)
   ```

3. **Start Web Frontend**
   ```bash
   cd Frontend/Web
   npm install
   npm run dev
   # Opens on http://localhost:5173
   ```

4. **Start Mobile (Expo)**
   ```bash
   cd Frontend/Mobile
   npm install
   npx expo start
   # Scan QR code with Expo Go app
   ```

### Docker Deployment
```bash
docker-compose up -d
```

---

## Contact & Support

- **System:** Naga City Stall Management System
- **Powered by:** DigiStall
- **Version:** 1.0.0

---

*Documentation generated: December 30, 2025*
