# Subscription Management System for System Administrators

## Overview
This feature allows **System Administrators** to manage Stall Business Owner accounts with a subscription-based payment system. Business Owners must pay a monthly subscription to access the system.

---

## 🎯 Features

### 1. **Subscription Plans**
- **Basic Plan**: ₱5,000/month - Up to 2 branches, 10 employees, 50 stalls
- **Standard Plan**: ₱10,000/month - Up to 5 branches, 25 employees, 150 stalls
- **Premium Plan**: ₱20,000/month - Unlimited branches, employees, and stalls

### 2. **Business Owner Management**
- Create new Business Owner accounts
- Assign subscription plans
- Track subscription status (Active, Expired, Suspended, Pending)
- Monitor expiration dates

### 3. **Payment Processing**
- Record monthly subscription payments
- Generate receipt numbers automatically
- Track payment history
- Support multiple payment methods (Cash, Bank Transfer, Credit Card, etc.)

### 4. **Dashboard Statistics**
- Total Business Owners
- Active Subscriptions
- Expiring Soon (within 7 days)
- Expired Subscriptions
- Revenue This Month
- Total Revenue
- Pending Payments

---

## 📋 Database Tables

### 1. `subscription_plans`
Stores available subscription plans.

```sql
- plan_id (Primary Key)
- plan_name (VARCHAR)
- plan_description (TEXT)
- monthly_fee (DECIMAL)
- max_branches (INT)
- max_employees (INT)
- features (JSON)
- status (ENUM: Active, Inactive)
```

### 2. `business_owner_subscriptions`
Tracks subscription records for each Business Owner.

```sql
- subscription_id (Primary Key)
- business_owner_id (Foreign Key)
- plan_id (Foreign Key)
- subscription_status (ENUM: Active, Expired, Suspended, Pending)
- start_date (DATE)
- end_date (DATE)
- auto_renew (BOOLEAN)
- created_by_system_admin (Foreign Key)
```

### 3. `subscription_payments`
Records all payment transactions.

```sql
- payment_id (Primary Key)
- subscription_id (Foreign Key)
- business_owner_id (Foreign Key)
- amount (DECIMAL)
- payment_date (DATE)
- payment_method (ENUM)
- payment_status (ENUM: Pending, Completed, Failed, Refunded)
- reference_number (VARCHAR)
- receipt_number (VARCHAR)
- payment_period_start (DATE)
- payment_period_end (DATE)
- processed_by_system_admin (Foreign Key)
```

---

## 🔌 API Endpoints

### Base URL: `/api/subscriptions`

All endpoints require **System Administrator** authentication.

#### 1. Get All Subscription Plans
```http
GET /api/subscriptions/plans
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "plan_id": 1,
      "plan_name": "Basic Plan",
      "monthly_fee": 5000.00,
      "max_branches": 2,
      "max_employees": 10
    }
  ]
}
```

#### 2. Create Business Owner with Subscription
```http
POST /api/subscriptions/business-owner
```
**Body:**
```json
{
  "username": "businessowner1",
  "password": "SecurePass123!",
  "firstName": "Juan",
  "lastName": "Dela Cruz",
  "email": "juan@business.com",
  "contactNumber": "09123456789",
  "planId": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Business owner created successfully. Awaiting first payment.",
  "data": {
    "business_owner_id": 5,
    "subscription_id": 3,
    "start_date": "2025-11-26",
    "end_date": "2025-12-26"
  }
}
```

#### 3. Record Subscription Payment
```http
POST /api/subscriptions/payment
```
**Body:**
```json
{
  "subscriptionId": 3,
  "businessOwnerId": 5,
  "amount": 5000.00,
  "paymentDate": "2025-11-26",
  "paymentMethod": "Bank Transfer",
  "referenceNumber": "BT-2025-001",
  "periodStart": "2025-11-26",
  "periodEnd": "2025-12-26",
  "notes": "First month subscription"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "payment_id": 10,
    "receipt_number": "RCPT-20251126-0342"
  }
}
```

#### 4. Get All Business Owners with Subscription Status
```http
GET /api/subscriptions/business-owners
```

#### 5. Get Business Owner Subscription Details
```http
GET /api/subscriptions/business-owner/:businessOwnerId
```

#### 6. Get Payment History
```http
GET /api/subscriptions/payment-history/:businessOwnerId
```

#### 7. Get Dashboard Statistics
```http
GET /api/subscriptions/dashboard-stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBusinessOwners": 15,
    "activeSubscriptions": 12,
    "expiringSoon": 3,
    "expiredSubscriptions": 2,
    "revenueThisMonth": 120000.00,
    "totalRevenue": 850000.00,
    "pendingPayments": 1
  }
}
```

---

## 🔧 Installation & Setup

### Step 1: Run Database Migration
```bash
# Navigate to your database folder
cd database/migrations

# Run the migration script in MySQL
mysql -u root -p naga_stall < 028_subscription_management_system.sql
```

Or use your MySQL client (phpMyAdmin, MySQL Workbench, etc.) to execute:
`database/migrations/028_subscription_management_system.sql`

### Step 2: Restart Backend Server
```bash
cd Backend
npm start
```

### Step 3: Verify Installation
Test the API endpoints using:
- Postman
- Thunder Client
- cURL

---

## 📱 Frontend Integration Guide

### 1. Create Subscription Management Pages

#### a. **Subscription Plans Page**
Location: `Frontend/Web/src/components/SystemAdmin/SubscriptionPlans/SubscriptionPlans.vue`

Features:
- Display all available plans
- Show plan details (price, features, limits)
- Allow selection for creating Business Owner

#### b. **Create Business Owner Page**
Location: `Frontend/Web/src/components/SystemAdmin/BusinessOwners/CreateBusinessOwner.vue`

Form Fields:
- Username
- Password
- First Name
- Last Name
- Email
- Contact Number
- Subscription Plan (dropdown)

#### c. **Business Owners List Page**
Location: `Frontend/Web/src/components/SystemAdmin/BusinessOwners/BusinessOwnersList.vue`

Table Columns:
- ID
- Name
- Email
- Plan
- Status
- Expiry Date
- Days Until Expiry
- Actions (View, Record Payment)

#### d. **Payment Recording Modal**
Location: `Frontend/Web/src/components/SystemAdmin/Payments/RecordPaymentModal.vue`

Form Fields:
- Amount
- Payment Date
- Payment Method
- Reference Number
- Payment Period
- Notes

#### e. **System Admin Dashboard**
Location: `Frontend/Web/src/components/SystemAdmin/Dashboard/SystemAdminDashboard.vue`

Statistics Cards:
- Total Business Owners
- Active Subscriptions
- Expiring Soon
- Revenue This Month
- Total Revenue

### 2. Update Router

Add routes in `Frontend/Web/src/router/index.js`:

```javascript
{
  path: '/system-admin',
  component: MainLayout,
  meta: { requiresRole: ['system_administrator'] },
  children: [
    {
      path: 'dashboard',
      component: SystemAdminDashboard,
      meta: { title: 'System Admin Dashboard' }
    },
    {
      path: 'business-owners',
      component: BusinessOwnersList,
      meta: { title: 'Business Owners' }
    },
    {
      path: 'subscription-plans',
      component: SubscriptionPlans,
      meta: { title: 'Subscription Plans' }
    }
  ]
}
```

### 3. Create API Service

Create `Frontend/Web/src/services/subscriptionService.js`:

```javascript
import apiClient from './apiClient';

export default {
  // Get all plans
  getPlans() {
    return apiClient.get('/subscriptions/plans');
  },
  
  // Create business owner
  createBusinessOwner(data) {
    return apiClient.post('/subscriptions/business-owner', data);
  },
  
  // Record payment
  recordPayment(data) {
    return apiClient.post('/subscriptions/payment', data);
  },
  
  // Get all business owners
  getAllBusinessOwners() {
    return apiClient.get('/subscriptions/business-owners');
  },
  
  // Get dashboard stats
  getDashboardStats() {
    return apiClient.get('/subscriptions/dashboard-stats');
  }
};
```

---

## 🎨 UI/UX Recommendations

### Dashboard Layout
```
┌─────────────────────────────────────────────────────┐
│  System Administrator Dashboard                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   15     │  │    12    │  │    3     │          │
│  │ Business │  │  Active  │  │ Expiring │          │
│  │  Owners  │  │   Subs   │  │   Soon   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ ₱120,000 │  │ ₱850,000 │  │    1     │          │
│  │This Month│  │  Total   │  │ Pending  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
│  Recent Business Owners                              │
│  ┌──────────────────────────────────────────┐       │
│  │ Name    | Plan     | Status  | Expiry   │       │
│  │ Juan DC | Basic    | Active  | 7 days   │       │
│  │ Maria S | Standard | Expiring| 2 days   │       │
│  └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

### Color Coding
- 🟢 **Green**: Active subscriptions
- 🟡 **Yellow**: Expiring soon (< 7 days)
- 🔴 **Red**: Expired subscriptions
- ⚪ **Gray**: Pending payment

---

## 🔒 Security Considerations

1. **Authentication**: All endpoints protected by System Administrator role
2. **Password Hashing**: Business Owner passwords hashed with bcrypt (12 rounds)
3. **Input Validation**: All user inputs validated on backend
4. **SQL Injection Prevention**: Parameterized queries used throughout
5. **Transaction Safety**: Database operations wrapped in transactions

---

## 📊 Business Logic

### Subscription Lifecycle

1. **Creation** → Status: Pending
2. **First Payment** → Status: Active, Expiry Date set
3. **Monthly Payment** → Expiry Date extended
4. **Grace Period** → 7 days before expiry (notification)
5. **Expiration** → Status: Expired (system access blocked)
6. **Renewal** → Record payment, reactivate

### Access Control

Business Owners with **Expired** or **Suspended** subscriptions cannot:
- Login to the system
- Access any features
- Create/manage branches
- Add employees

---

## 🚀 Next Steps

1. **Run the migration** to create tables and procedures
2. **Test API endpoints** using Postman
3. **Build frontend components** following the guide above
4. **Add email notifications** for expiring subscriptions
5. **Implement auto-renewal** logic
6. **Add subscription reports** (Excel export)

---

## 📞 Support

For questions or issues:
- Check the stored procedures in the database
- Review API responses for error messages
- Verify System Administrator authentication token

---

**Created**: November 26, 2025  
**Version**: 1.0  
**Author**: DigiStall Development Team
