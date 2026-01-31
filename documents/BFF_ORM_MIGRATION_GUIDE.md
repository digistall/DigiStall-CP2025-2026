# BFF & ORM Architecture Migration Guide

## Overview

This guide explains the new **Backend for Frontend (BFF)** pattern and **ORM (Prisma)** integration for the Naga Stall Management System.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENTS                              │
├─────────────────────────────────────────────────────────────────────┤
│     Web App (Vue.js)              │        Mobile App (React Native) │
│     - Admin Dashboard             │        - Inspector App            │
│     - Landing Page                │        - Collector App            │
│     - Management Portal           │        - Stallholder App          │
└───────────────┬───────────────────┴──────────────┬───────────────────┘
                │                                   │
                ▼                                   ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        BFF LAYER (Backend for Frontend)                │
├───────────────────────────────────┬───────────────────────────────────┤
│        Web BFF Adapters           │       Mobile BFF Adapters          │
│        (Port 3001)                │       (Port 3002)                  │
│                                   │                                    │
│  ┌─────────────────────────┐      │  ┌─────────────────────────┐       │
│  │ stallAdapter.js         │      │  │ stallAdapter.js         │       │
│  │ - transformForAdminList │      │  │ - transformForMobileList│       │
│  │ - transformForDetail    │      │  │ - transformForInspector │       │
│  │ - transformForLanding   │      │  │ - transformForCollector │       │
│  └─────────────────────────┘      │  └─────────────────────────┘       │
└───────────────────────────────────┴───────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    SHARED CORE LAYER                                   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    SERVICES (Business Logic)                     │  │
│  │  stallService.js | authService.js | paymentService.js            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                   │
│                                    ▼                                   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                 REPOSITORIES (Data Access Layer)                 │  │
│  │  stallRepository.js | employeeRepository.js | paymentRepo...     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                   │
│                                    ▼                                   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      PRISMA ORM CLIENT                           │  │
│  │  Type-safe queries | Connection pooling | Migrations             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        MySQL DATABASE                                  │
│                   (DigitalOcean Managed DB)                           │
└───────────────────────────────────────────────────────────────────────┘
```

## What Changed

### 1. ORM (Prisma) Integration

**Before:** Raw SQL queries with mysql2
```javascript
// Old way
const [stalls] = await connection.execute(
  `SELECT s.*, b.branch_name FROM stall s 
   LEFT JOIN branch b ON s.branch_id = b.branch_id 
   WHERE s.branch_id = ?`,
  [branchId]
);
```

**After:** Type-safe Prisma queries
```javascript
// New way with Prisma
const stalls = await prisma.stall.findMany({
  where: { branch_id: branchId },
  include: { branch: true, stallholder: true }
});
```

### 2. Repository Pattern

All database operations now go through repositories:

```javascript
import { StallRepository } from '@naga-stall/shared/repositories';

// Get stalls
const stalls = await StallRepository.findAllByBranch(branchId);

// Create stall
const newStall = await StallRepository.create(stallData);

// Update stall
const updated = await StallRepository.update(stallId, { status: 'occupied' });
```

### 3. BFF Adapters

Different data transformations for Web vs Mobile:

```javascript
// Web BFF - Full admin data
import { WebStallAdapter } from '@naga-stall/shared/bff/web';
const stalls = await WebStallAdapter.getAdminStalls(branchId);

// Mobile BFF - Compact data for mobile
import { MobileStallAdapter } from '@naga-stall/shared/bff/mobile';
const stalls = await MobileStallAdapter.getMobileStalls(branchId);
```

## Setup Instructions

### Step 1: Install Prisma

```bash
cd Backend/shared
npm install
```

### Step 2: Configure Database URL

Add to your `.env` file:
```env
DATABASE_URL="mysql://user:password@host:port/database?ssl=true"
```

### Step 3: Pull Existing Database Schema

```bash
cd Backend/shared
npx prisma db pull --schema=./prisma/schema.prisma
```

### Step 4: Generate Prisma Client

```bash
npx prisma generate --schema=./prisma/schema.prisma
```

### Step 5: Link Shared Module

In `Backend-Web/package.json` and `Backend-Mobile/package.json`:
```json
{
  "dependencies": {
    "@naga-stall/shared": "file:../shared"
  }
}
```

Then run:
```bash
cd Backend-Web
npm install

cd ../Backend-Mobile  
npm install
```

## Using the New Architecture

### Example: Updating a Controller

**Before (Raw SQL):**
```javascript
export const getAllStalls = async (req, res) => {
  const connection = await createConnection();
  const [stalls] = await connection.execute('SELECT * FROM stall');
  res.json({ data: stalls });
};
```

**After (Using Shared Services + BFF):**
```javascript
import { WebStallAdapter } from '@naga-stall/shared/bff/web';

export const getAllStalls = async (req, res) => {
  const branchId = req.user.branchId;
  const stalls = await WebStallAdapter.getAdminStalls(branchId);
  
  res.json({
    success: true,
    data: stalls,
    count: stalls.length
  });
};
```

## File Structure

```
Backend/
├── shared/                      # Shared core libraries
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── generated/
│   │   └── prisma-client/       # Generated Prisma client
│   ├── database/
│   │   └── prismaClient.js      # Prisma singleton
│   ├── repositories/            # Data access layer
│   │   ├── index.js
│   │   ├── stallRepository.js
│   │   ├── employeeRepository.js
│   │   └── ...
│   ├── services/                # Business logic
│   │   ├── index.js
│   │   ├── stallService.js
│   │   └── authService.js
│   ├── bff/                     # Backend for Frontend adapters
│   │   ├── web/
│   │   │   ├── index.js
│   │   │   └── stallAdapter.js
│   │   └── mobile/
│   │       ├── index.js
│   │       └── stallAdapter.js
│   ├── utils/
│   │   └── encryption.js
│   ├── index.js
│   └── package.json
│
├── Backend-Web/                 # Web API (uses shared + web BFF)
└── Backend-Mobile/              # Mobile API (uses shared + mobile BFF)
```

## Benefits

| Feature | Before | After |
|---------|--------|-------|
| **Database Queries** | Raw SQL strings | Type-safe Prisma |
| **Code Reuse** | Duplicated in Web/Mobile | Shared repositories |
| **Data Format** | Same for all clients | BFF adapters per client |
| **Connection Pool** | Manual management | Prisma handles it |
| **Migrations** | Manual SQL files | Prisma migrations |
| **Type Safety** | None | Full TypeScript support |

## Gradual Migration

You don't need to migrate everything at once. The old code still works!

1. Start with new features using the new architecture
2. Gradually refactor existing controllers
3. Keep old code working during transition

## Prisma Studio

View and edit database directly:
```bash
cd Backend/shared
npx prisma studio
```

Opens a web interface at http://localhost:5555

## Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
cd Backend/shared
npx prisma generate
```

### "Connection pool exhausted"
The prismaClient.js uses a singleton pattern - make sure you're importing from the shared module, not creating new clients.

### "Table doesn't exist"
```bash
npx prisma db pull  # Sync schema from existing database
npx prisma generate # Regenerate client
```

## Next Steps

1. ✅ Prisma schema created
2. ✅ Repositories implemented  
3. ✅ Services layer created
4. ✅ BFF adapters for Web/Mobile
5. ⏳ Migrate controllers gradually
6. ⏳ Add more service methods as needed
7. ⏳ Add Prisma migrations for schema changes
