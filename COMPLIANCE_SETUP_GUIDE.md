# Compliance Backend Setup Guide

## 🎯 Overview
Complete backend implementation for the Compliance Management System in DigiStall, including database enhancements, API endpoints, and frontend integration.

---

## 📦 What Was Created

### 1. **Database Migration**
- **File**: `database/migrations/022_compliance_system_enhancement.sql`
- **Enhancements**:
  - Added `status` column (`pending`, `in-progress`, `complete`, `incomplete`)
  - Added `severity` column (`minor`, `moderate`, `major`, `critical`)
  - Added `compliance_type` for custom violation types
  - Added `resolved_date` and `resolved_by` for tracking
  - Created stored procedures for efficient data management
  - Created `view_compliance_records` for easy querying

### 2. **Backend Controller**
- **File**: `Backend/Backend-Web/controllers/compliances/complianceController.js`
- **Functions**:
  - `getAllComplianceRecords` - Get all with filters
  - `getComplianceRecordById` - Get single record
  - `createComplianceRecord` - Create new compliance
  - `updateComplianceRecord` - Update status/remarks
  - `deleteComplianceRecord` - Delete record
  - `getComplianceStatistics` - Get summary stats
  - `getAllInspectors` - Get inspector list
  - `getAllViolations` - Get violation types
  - `getViolationPenalties` - Get penalties

### 3. **API Routes**
- **File**: `Backend/Backend-Web/routes/complianceRoutes.js`
- **Endpoints**: `/api/compliances/*`
- All routes protected with authentication
- Permission-based access control

### 4. **Frontend Integration**
- **Updated**: `Frontend/Web/src/components/Admin/Compliances/Compliance.js`
- Connected to backend API
- Real-time data fetching
- Search and filter support
- Error handling

### 5. **Documentation**
- **File**: `Backend/Backend-Web/controllers/compliances/COMPLIANCE_API_DOCS.md`
- Complete API documentation
- Usage examples
- Error handling guide

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

```bash
# Navigate to project root
cd D:\YESHO\nagastall\DigiStall-CP2025-2026

# Run the migration
mysql -u root -p naga_stall < database/migrations/022_compliance_system_enhancement.sql
```

**Or using phpMyAdmin:**
1. Open phpMyAdmin
2. Select `naga_stall` database
3. Go to SQL tab
4. Copy and paste the contents of `022_compliance_system_enhancement.sql`
5. Click "Go"

### Step 2: Verify Migration

```sql
-- Check if migration was recorded
SELECT * FROM migrations WHERE migration_name = '022_compliance_system_enhancement';

-- Check new columns
DESCRIBE violation_report;

-- Test stored procedure
CALL getAllComplianceRecords(NULL, 'all', '');
```

### Step 3: Start Backend Server

```powershell
cd Backend
npm run dev
```

**Expected output:**
```
🚀 Naga Stall Management System - Unified Backend
📍 Server running on port 3001
✅ Database connection successful
✅ Database tables initialized
```

### Step 4: Start Frontend

```powershell
cd Frontend\Web
npm run dev
```

**Expected output:**
```
VITE v7.0.6  ready in 1234 ms
➜  Local:   http://localhost:5173/
```

---

## 🧪 Testing the API

### 1. Get All Compliance Records
```bash
curl -X GET "http://localhost:3001/api/compliances" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Create Compliance Record
```bash
curl -X POST "http://localhost:3001/api/compliances" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stallholder_id": 1,
    "compliance_type": "Sanitary Issue",
    "severity": "moderate",
    "remarks": "Test compliance record"
  }'
```

### 3. Update Compliance Status
```bash
curl -X PUT "http://localhost:3001/api/compliances/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "complete",
    "remarks": "Issue resolved"
  }'
```

### 4. Get Statistics
```bash
curl -X GET "http://localhost:3001/api/compliances/statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Database Schema Changes

### violation_report Table (Enhanced)
```sql
ALTER TABLE violation_report ADD COLUMN:
- status ENUM('pending', 'in-progress', 'complete', 'incomplete')
- severity ENUM('minor', 'moderate', 'major', 'critical')
- compliance_type VARCHAR(100)
- resolved_date DATETIME
- resolved_by INT
```

### New View: view_compliance_records
Consolidates data from multiple tables for easy frontend consumption:
- violation_report
- inspector
- stallholder
- violation
- branch
- stall
- violation_penalty

---

## 🔐 Permissions

### Required Permission
Users need the `compliances` permission to access compliance endpoints.

### Access Levels
- **Admin**: Full access to all branches
- **Branch Manager**: Access to their branch only
- **Employee**: Access if they have `compliances` permission (branch-restricted)

---

## 🎨 Frontend Usage

### Accessing Compliance Page
1. Login to the system
2. Navigate to `/app/compliances`
3. Ensure user has `compliances` permission

### Features Available
- ✅ View all compliance records
- ✅ Search by ID, type, inspector, stallholder
- ✅ Filter by status (pending, in-progress, complete, incomplete)
- ✅ View compliance details
- ✅ Edit compliance status
- ✅ Delete compliance records (admin/branch manager only)
- ✅ Real-time statistics

---

## 🐛 Troubleshooting

### Backend not starting
```powershell
# Check if port 3001 is already in use
netstat -ano | findstr :3001

# Kill process if needed
taskkill /PID <PID_NUMBER> /F

# Restart backend
npm run dev
```

### Database connection error
1. Check MySQL is running
2. Verify credentials in `.env`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=naga_stall
   ```

### Migration failed
```sql
-- Check which migrations have run
SELECT * FROM migrations ORDER BY executed_at DESC;

-- If migration exists but failed, remove it and retry
DELETE FROM migrations WHERE migration_name = '022_compliance_system_enhancement';
```

### Frontend shows "No data"
1. Check if backend is running on port 3001
2. Verify authentication token in sessionStorage
3. Check browser console for errors
4. Ensure user has `compliances` permission

### CORS Error
Ensure backend CORS config allows frontend origin:
```javascript
// Backend/config/cors.js
allowedOrigins: [
  'http://localhost:5173',  // Vite dev server
  // ... other origins
]
```

---

## 📚 API Endpoints Summary

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/compliances` | Get all records | compliances |
| GET | `/api/compliances/:id` | Get single record | compliances |
| POST | `/api/compliances` | Create record | compliances |
| PUT | `/api/compliances/:id` | Update record | compliances |
| DELETE | `/api/compliances/:id` | Delete record | admin/manager |
| GET | `/api/compliances/statistics` | Get stats | compliances |
| GET | `/api/compliances/helpers/inspectors` | Get inspectors | compliances |
| GET | `/api/compliances/helpers/violations` | Get violations | compliances |
| GET | `/api/compliances/helpers/violations/:id/penalties` | Get penalties | compliances |

---

## ✅ Verification Checklist

- [ ] Database migration executed successfully
- [ ] Backend server starts without errors
- [ ] Frontend can connect to backend
- [ ] Can view compliance records
- [ ] Can create new compliance record
- [ ] Can update compliance status
- [ ] Search and filter work correctly
- [ ] Statistics display properly
- [ ] Permission checks work (try different user roles)
- [ ] Error messages are user-friendly

---

## 📝 Next Steps (Optional Enhancements)

1. **Add Image Upload**: Allow evidence photos for violations
2. **Email Notifications**: Notify stallholders of violations
3. **Compliance Reports**: Generate PDF reports
4. **Mobile Integration**: Add compliance to mobile app
5. **Analytics Dashboard**: Visual charts and trends
6. **Automated Reminders**: For pending/overdue items
7. **Audit Trail**: Track all changes to records

---

## 💡 Tips

- Always check backend console for detailed error logs
- Use browser DevTools Network tab to debug API calls
- Test with different user roles (admin, manager, employee)
- Keep API documentation handy for reference
- Use stored procedures for complex queries (better performance)

---

## 🤝 Support

For issues or questions:
1. Check the API documentation
2. Review backend console logs
3. Check browser console for frontend errors
4. Verify database migration status
5. Test API endpoints directly with curl/Postman

---

**Created**: November 16, 2025
**Version**: 1.0.0
**Status**: ✅ Ready for Production
