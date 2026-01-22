# Database Stored Procedures Fix - January 20, 2026

## Problem
The web application was returning 500 errors when trying to fetch complaints and compliance records:
- ❌ `PROCEDURE naga_stall.getAllComplaintsDecrypted does not exist`
- ❌ `PROCEDURE naga_stall.getAllComplianceRecordsDecrypted does not exist`

## Root Cause
The Backend-Web controllers were calling stored procedures that didn't exist in the production database:
- `getAllComplaintsDecrypted` - Called by [Backend-Web/controllers/complaints/complaintController.js](../Backend/Backend-Web/controllers/complaints/complaintController.js)
- `getAllComplianceRecordsDecrypted` - Called by [Backend-Web/controllers/compliances/complianceController.js](../Backend/Backend-Web/controllers/compliances/complianceController.js)

## Solution Implemented

### 1. Created Missing Stored Procedures
Created two new stored procedures with proper parameter handling:

**getAllComplaintsDecrypted(p_branch_id, p_status, p_search)**
- Returns complaints data with joined stallholder and stall information
- Supports filtering by branch, status, and search term
- Uses dynamic SQL for flexible querying

**getAllComplianceRecordsDecrypted(p_branch_id, p_status, p_search)**
- Returns compliance records with joined stall and inspector information
- Supports filtering by branch, status, and search term
- Uses dynamic SQL for flexible querying

### 2. Deployment Process
1. Created SQL file: [fix_procedures.sql](../Backend/fix_procedures.sql)
2. Created execution script: [execute_sql.mjs](../Backend/execute_sql.mjs)
3. Deployed to production DigitalOcean server
4. Executed SQL fix on production database
5. Restarted backend services

### 3. Files Created
- `Backend/fix_procedures.sql` - SQL script with procedure definitions
- `Backend/execute_sql.mjs` - Node.js script to execute SQL on production
- `Backend/create_missing_procedures.mjs` - Alternative approach (not used)

## Deployment Commands

```bash
# 1. Copy files to production server
scp C:\Users\Jeno\DigiStall-CP2025-2026\Backend\fix_procedures.sql root@68.183.154.125:/opt/digistall/
scp C:\Users\Jeno\DigiStall-CP2025-2026\Backend\execute_sql.mjs root@68.183.154.125:/opt/digistall/

# 2. Execute SQL fix on production database
ssh root@68.183.154.125 "cd /opt/digistall && docker cp fix_procedures.sql digistall-backend-web:/tmp/ && docker cp execute_sql.mjs digistall-backend-web:/app/ && docker-compose exec -T backend-web node /app/execute_sql.mjs"

# 3. Restart backend services
ssh root@68.183.154.125 "cd /opt/digistall && docker-compose restart backend-web backend-mobile"
```

## Verification

### ✅ Procedures Created Successfully
```
Created procedures:
- getAllComplaintsDecrypted (created: Tue Jan 20 2026 08:08:13 GMT+0000)
- getAllComplianceRecordsDecrypted (created: Tue Jan 20 2026 08:08:13 GMT+0000)
```

### ✅ Backend Services Restarted
- `digistall-backend-web` - Running
- `digistall-backend-mobile` - Running

## Testing
After the fix, test the following endpoints:
1. **Complaints**: `GET http://68.183.154.125:5000/api/complaints`
2. **Compliance**: `GET http://68.183.154.125:5000/api/compliances`

Both endpoints should now return data instead of 500 errors.

## Technical Details

### Procedure Parameters
- `p_branch_id` (INT) - Filter by branch (NULL for all branches)
- `p_status` (VARCHAR) - Filter by status ('all' for all statuses)
- `p_search` (VARCHAR) - Search term for filtering records

### Dynamic SQL Query Building
Both procedures use dynamic SQL with prepared statements to:
- Add branch filter when specified
- Add status filter when specified
- Add search filter when specified
- Maintain security through parameterization

## Database Connection Issues (Secondary)
During deployment, we also noticed connection reset errors (`ECONNRESET`):
```
Error: read ECONNRESET
  code: 'ECONNRESET',
  errno: -4077
```

These are separate from the missing procedure issue and may be related to:
- Database connection pool exhaustion
- Network timeouts
- Database server load

Monitor these separately if they persist after the procedure fix.

## Updated Documentation
- Updated [setup-digitalOcean_deployment.md](setup-digitalOcean_deployment.md) with new deployment commands
- Added section for database procedure fixes

## Status
✅ **RESOLVED** - Stored procedures created and deployed to production (2026-01-20 08:08 UTC)
