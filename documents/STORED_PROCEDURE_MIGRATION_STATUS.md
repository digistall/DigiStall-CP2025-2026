# Stored Procedure Migration Status

## Summary

This document tracks the progress of migrating direct SQL queries to stored procedures across the DigiStall application.

## ✅ COMPLETED

### Migration Files Created (Run these in MySQL first!)

| Migration File | Purpose | Stored Procedures |
|----------------|---------|-------------------|
| `307_sp_mobileStaffAuth.sql` | Mobile staff authentication | `sp_getInspectorByUsername`, `sp_getCollectorByUsername`, `sp_updateInspectorLastLogin`, `sp_updateCollectorLastLogin`, `sp_updateInspectorLastLogout`, `sp_updateCollectorLastLogout`, `sp_getInspectorNameById`, `sp_getCollectorNameById`, `sp_logStaffActivity` |
| `308_sp_paymentController.sql` | Payment operations | `sp_getOnsitePaymentsAll`, `sp_getOnsitePaymentsByBranches`, `sp_getOnlinePaymentsAll`, `sp_getOnlinePaymentsByBranches`, `sp_approvePayment`, `sp_declinePayment`, `sp_getPaymentStatsAll`, `sp_getPaymentStatsByBranches` |
| `309_sp_employeeController.sql` | Employee operations | `sp_getAllEmployeesAll`, `sp_getAllEmployeesByBranches`, `sp_getEmployeeByIdWithBranch`, `sp_getActiveSessionsAll`, `sp_getActiveSessionsByBranches`, `sp_deactivateEmployeeSessions`, `sp_terminateEmployee`, `sp_logoutEmployee` |
| `310_sp_mobileStaffController.sql` | Mobile staff management | `sp_checkInspectorEmailExists`, `sp_checkCollectorEmailExists`, etc. |
| `311_sp_rolePermissions.sql` | Branch filter operations | `sp_getBranchIdForManager`, `sp_getBranchIdForEmployee`, `sp_getBranchIdsForOwner` |
| `312_sp_enhancedAuth.sql` | Enhanced JWT authentication | `sp_storeRefreshToken`, `sp_logTokenActivity`, `sp_getActiveRefreshToken`, `sp_updateRefreshTokenLastUsed`, `sp_heartbeat*`, `sp_check*Exists`, `sp_revokeRefreshTokenByHash`, `sp_getRefreshTokenByHash`, `sp_update*LastLogout` |
| `313_sp_stallholderController.sql` | Stallholder operations | `sp_getAllStallholdersAll`, `sp_getAllStallholdersByBranches`, `sp_getFirstFloorByBranch`, `sp_getFirstSectionByFloor`, etc. |
| `314_sp_unifiedAuthController.sql` | Unified authentication | `sp_getSystemAdminByUsername`, `sp_getBusinessOwnerByUsername`, `sp_getBusinessManagerByUsername`, `sp_getBusinessEmployeeByUsername`, `sp_getBranchById`, `sp_update*LastLoginNow`, `sp_logStaffActivityLogin`, `sp_logStaffActivityLogout`, `sp_get*ById`, `sp_get*WithBranch` |

### Controllers Updated

| File | Status | Changes |
|------|--------|---------|
| `Backend-Mobile/controllers/mobileStaffAuthController.js` | ✅ Done | All functions converted to use CALL statements |
| `Backend-Web/controllers/payments/paymentController.js` | ✅ Done | `getOnsitePayments`, `getOnlinePayments`, `approvePayment`, `declinePayment`, `getPaymentStats` |
| `Backend-Web/controllers/employees/employeeController.js` | ✅ Done | `getAllEmployees`, `getActiveSessions`, `deleteEmployee`, `logoutEmployee` |
| `Backend-Web/middleware/rolePermissions.js` | ✅ Done | `getOwnerBranches`, `getBranchFilter` branch lookups |
| `Backend-Web/controllers/mobilestaff/mobileStaffController.js` | ✅ Done | All CRUD operations for inspectors and collectors |
| `Backend-Web/controllers/auth/unifiedAuthController.js` | ✅ Done | Login, getCurrentUser, branch queries, last login updates, activity logging |
| `Backend-Web/controllers/auth/enhancedAuthController.js` | ✅ Done | RefreshToken, logout, heartbeat, token management, activity logging |
| `Backend-Web/controllers/stallholders/stallholderController.js` | 🔄 Partial | `getAllStallholders` done, Excel import functions remain |
| `Frontend/Web/src/components/Admin/Dashboard/Dashboard.js` | ✅ Done | Fixed `getLastActivity` and `formatRelativeTime` for proper time display |

---

## 🔴 REMAINING (200+ queries across 40+ files)

### Tier 1 - Critical (Most Complex)

| File | ~Queries | Description |
|------|----------|-------------|
| `stallholders/stallholderController.js` | ~35 | Excel import, bulk operations |
| `stalls/stallComponents/raffleComponents/selectWinner.js` | ~14 | Raffle winner selection |
| `stalls/stallComponents/auctionComponents/selectWinner.js` | ~14 | Auction winner selection |
| `auth/enhancedAuthController.js` | ~15 | JWT authentication logic |
| `stalls/addStall.js` | ~12 | Stall creation with images |

### Tier 2 - Important (Medium Complexity)

| File | ~Queries |
|------|----------|
| `stalls/stallComponents/auctionComponents/placeBid.js` | ~10 |
| `stalls/stallComponents/addStallWithImages.js` | ~10 |
| `documents/stallholderDocumentBlobController.js` | ~10 |
| `stalls/stallComponents/raffleComponents/manageRaffle.js` | ~8 |
| `stalls/stallComponents/auctionComponents/manageAuction.js` | ~8 |
| `stalls/stallComponents/getLiveStallInfo.js` | ~8 |
| `stall/stallController.js` (Mobile) | ~12 |

### Tier 3 - Lower Priority

- Branch component files (14 files, ~25 queries total)
- Landing page components (1 query each)
- Simple CRUD operations

---

## How to Apply Migrations

1. **Connect to your MySQL database**
2. **Run each migration file in order:**
   ```bash
   mysql -u your_user -p your_database < database/migrations/307_sp_mobileStaffAuth.sql
   mysql -u your_user -p your_database < database/migrations/308_sp_paymentController.sql
   mysql -u your_user -p your_database < database/migrations/309_sp_employeeController.sql
   mysql -u your_user -p your_database < database/migrations/310_sp_mobileStaffController.sql
   mysql -u your_user -p your_database < database/migrations/311_sp_rolePermissions.sql
   mysql -u your_user -p your_database < database/migrations/312_sp_enhancedAuth.sql
   ```

3. **Restart your backend servers**

---

## How to Apply NEW Migrations (312-314)

```bash
mysql -u your_user -p your_database < database/migrations/312_sp_enhancedAuth.sql
mysql -u your_user -p your_database < database/migrations/313_sp_stallholderController.sql
mysql -u your_user -p your_database < database/migrations/314_sp_unifiedAuthController.sql
```

---

## Notes

- The migration is ongoing - critical auth controllers are now fully converted
- Direct SQL queries in remaining files still work, but should be migrated eventually for consistency
- Priority should be given to Tier 1 files for full stored procedure coverage
- Authentication flows (login, logout, heartbeat, token refresh) are now fully stored procedure based

---

*Last Updated: Current Session*
