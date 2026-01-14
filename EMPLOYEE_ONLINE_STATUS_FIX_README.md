# Employee Online Status Fix - MUST READ

## 🚨 CRITICAL: Run the SQL File First!

The error `GET http://localhost:3001/api/employees/sessions/active 500 (Internal Server Error)` means the stored procedures don't exist in your MySQL database yet.

### Step 1: Run the SQL Fix in MySQL Workbench

1. Open **MySQL Workbench**
2. Connect to your database
3. Open this file: `c:\Users\Jeno\DigiStall-CP2025-2026\database\FIX_EMPLOYEE_ONLINE_STATUS.sql`
4. Click **Execute** (⚡ icon)
5. Wait for "Employee Online Status Fix - Stored Procedures Created Successfully!"

This will:
- ✅ Create `staff_session` table for inspector/collector tracking
- ✅ Create/update all session stored procedures with Philippine timezone fix
- ✅ Fix the 500 error on `/api/employees/sessions/active`

### Step 2: Restart Servers (Already Done)

The backend and frontend have been updated to use the new stored procedures.

---

## 📋 What Was Fixed

### 1. **Timezone Issue** ⏰
- All session times now use **Philippine Time (UTC+8)**
- No more "8 hours ago" when you just logged in

### 2. **Inspector/Collector Online Status** 👮
- Mobile inspector/collector login now creates session in `staff_session` table
- Active employee dashboard will show inspector/collector online status
- Works for both WEB and MOBILE logins

### 3. **Employee Without Dashboard Permission** 🔓
- Employees without dashboard permission now redirect to their first available page
- Example: If employee only has "payments" permission, they go to `/app/payment`
- No more white screen!

### 4. **Permission Updates** 🔄
**Important**: When you edit an employee's permissions:
- The employee MUST **log out and log back in** to see changes
- JWT tokens cache permissions at login time
- This is standard JWT behavior - not a bug!

---

## 🧪 How to Test After Running SQL

### Test 1: Web Employee Login
1. Login as business_employee via WEB
2. Should show as ONLINE in active employee dashboard
3. Time should show "just now" or "1 minute ago"

### Test 2: Mobile Inspector Login
1. Login as inspector via MOBILE app
2. Should show as ONLINE in active employee dashboard (WEB)
3. Shows as "inspector" user type

### Test 3: Employee Without Dashboard Permission
1. Edit an employee to remove "dashboard" permission but keep "payments"
2. Tell employee to **logout and login again**
3. Should redirect to Payment page instead of Dashboard
4. No white screen!

---

## ⚠️ Common Issues

### "White Screen After Login"
- You haven't run the SQL file yet
- Or the route doesn't exist (now fixed)

### "Still Shows 8 Hours Ago"
- You haven't run the SQL file yet
- Stored procedures still using UTC time

### "Mobile Inspector Not Showing Online"
- You haven't run the SQL file yet
- `staff_session` table doesn't exist

### "Permission Changes Not Showing"
- Employee needs to **logout and login again**
- JWT tokens don't auto-refresh

---

## 📝 Files Modified

### Backend
- `Backend-Mobile/controllers/mobileStaffAuthController.js` - Added staff session tracking
- `Backend-Web/controllers/auth/unifiedAuthController.js` - Already had employee session tracking
- `Backend-Web/controllers/employees/employeeController.js` - Uses session stored procedures

### Frontend
- `Frontend/Web/src/router/index.js` - Smart redirect based on permissions
- `Frontend/Web/src/components/Admin/Login/LoginPage_Enhanced.js` - Smart redirect on login
- `Frontend/Web/src/App.vue` - Smart redirect for cross-tab login

### Database
- `database/FIX_EMPLOYEE_ONLINE_STATUS.sql` - **RUN THIS IN MYSQL WORKBENCH!**

---

## ✅ Success Criteria

After running the SQL file:
- ✅ No 500 error on active employee sessions
- ✅ Web employee login shows online with correct time
- ✅ Mobile inspector login shows online with correct time
- ✅ Employee without dashboard permission redirects to first available page
- ✅ Permission changes work after employee re-login
