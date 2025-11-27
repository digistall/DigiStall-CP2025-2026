# Quick Testing Guide for Bug Fixes

## Prerequisites
- Backend server running on port 3001
- Frontend server running on port 5173
- Test accounts:
  - business_manager account
  - stall_business_owner account with access to multiple branches

---

## Test 1: Applicants Controller (Fixed 500 Error)

### business_manager Test
```bash
# Login as business_manager
# Navigate to Applicants page
GET http://localhost:3001/api/applicants/my-stall-applicants

Expected:
✅ 200 OK
✅ Returns applicants for single branch
✅ No 500 error
```

### stall_business_owner Test
```bash
# Login as stall_business_owner
# Navigate to Applicants page
GET http://localhost:3001/api/applicants/my-stall-applicants

Expected:
✅ 200 OK
✅ Returns applicants for multiple branches
✅ No 500 error
✅ Data includes applicants from all owned branches
```

---

## Test 2: Stallholders Controller (Fixed 500 Error)

### business_manager Test
```bash
GET http://localhost:3001/api/stallholders

Expected:
✅ 200 OK
✅ Returns stallholders for single branch
```

### stall_business_owner Test
```bash
GET http://localhost:3001/api/stallholders

Expected:
✅ 200 OK
✅ Returns stallholders for multiple branches
✅ Data includes stallholders from all owned branches
```

---

## Test 3: Compliance Controller (Fixed 500 Error)

### business_manager Test
```bash
GET http://localhost:3001/api/compliances

Expected:
✅ 200 OK
✅ Returns compliance records for single branch
✅ No 500 error
```

### stall_business_owner Test
```bash
GET http://localhost:3001/api/compliances

Expected:
✅ 200 OK
✅ Returns compliance records for multiple branches
```

---

## Test 4: Branch Routes (Fixed 403 Errors)

### Floors Endpoint
```bash
# Login as stall_business_owner
GET http://localhost:3001/api/branches/floors

Expected:
✅ 200 OK (NOT 403)
✅ Returns floors for all owned branches
```

### Sections Endpoint
```bash
# Login as stall_business_owner
GET http://localhost:3001/api/branches/sections

Expected:
✅ 200 OK (NOT 403)
✅ Returns sections for all owned branches
```

---

## Test 5: Payment Routes (Verified Access)

```bash
# Login as stall_business_owner
GET http://localhost:3001/api/payments/online

Expected:
✅ 200 OK (NOT 403)
✅ Returns online payments for all owned branches
```

---

## Test 6: Subscription Management UI (New Feature)

### Step 1: View Current Subscription
1. Login as `stall_business_owner`
2. Navigate to "My Subscription" page
3. Verify current subscription displays:
   - ✅ Plan name
   - ✅ Monthly fee
   - ✅ Start/end dates
   - ✅ Days until expiry
   - ✅ Plan features (max branches, employees, etc.)

### Step 2: View Available Plans
1. Click "Change Plan" button
2. Verify dialog opens showing all plans
3. Check each plan card displays:
   - ✅ Plan name
   - ✅ Monthly fee (₱X,XXX/mo format)
   - ✅ Features with checkmarks
   - ✅ Current plan is highlighted (green border)
   - ✅ "Current Plan" badge on active plan

### Step 3: Change Plan
1. Click "Select Plan" on a different plan
2. Verify confirmation dialog appears
3. Click OK to confirm
4. Expected:
   - ✅ Success message displayed
   - ✅ Dialog closes
   - ✅ Page reloads with new plan
   - ✅ New plan shown as current

### Step 4: View Payment History
1. Scroll down to Payment History table
2. Verify table displays:
   - ✅ Payment ID
   - ✅ Receipt number
   - ✅ Amount (₱X,XXX.XX format)
   - ✅ Payment date
   - ✅ Payment method
   - ✅ Payment status (colored chip)
   - ✅ Period covered

---

## Test 7: View-Only Protection (Existing Feature)

### Test Write Operations as stall_business_owner

```bash
# All of these should return 403 with VIEW_ONLY_RESTRICTION

POST http://localhost:3001/api/stallholders
Expected: ❌ 403 Forbidden

PUT http://localhost:3001/api/stallholders/1
Expected: ❌ 403 Forbidden

DELETE http://localhost:3001/api/stallholders/1
Expected: ❌ 403 Forbidden

POST http://localhost:3001/api/compliances
Expected: ❌ 403 Forbidden

DELETE http://localhost:3001/api/applicants/1
Expected: ❌ 403 Forbidden
```

Expected Error Response:
```json
{
  "success": false,
  "message": "Business owners have view-only access.",
  "errorCode": "VIEW_ONLY_RESTRICTION"
}
```

---

## Quick Browser Testing Script

### Open Browser Console and Run:

```javascript
// Test all endpoints as logged-in user
const token = sessionStorage.getItem('authToken');

const testEndpoints = async () => {
  const endpoints = [
    '/api/applicants/my-stall-applicants',
    '/api/stallholders',
    '/api/compliances',
    '/api/branches/floors',
    '/api/branches/sections',
    '/api/payments/online',
    '/api/subscriptions/my-subscription',
    '/api/subscriptions/plans'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error(`${endpoint}: ERROR`, error);
    }
  }
};

testEndpoints();
```

Expected Output (all should be 200 OK):
```
/api/applicants/my-stall-applicants: 200 OK
/api/stallholders: 200 OK
/api/compliances: 200 OK
/api/branches/floors: 200 OK
/api/branches/sections: 200 OK
/api/payments/online: 200 OK
/api/subscriptions/my-subscription: 200 OK
/api/subscriptions/plans: 200 OK
```

---

## Common Issues & Solutions

### Issue: Still getting 500 errors
**Solution:** 
1. Check backend terminal for detailed error message
2. Verify database connection is active
3. Confirm business_owner_managers table has correct data
4. Restart backend server

### Issue: Still getting 403 errors
**Solution:**
1. Verify user is logged in correctly
2. Check authentication token in sessionStorage
3. Confirm user role is `stall_business_owner`
4. Verify backend middleware is not blocking the route

### Issue: Subscription plan dialog is empty
**Solution:**
1. Check if subscription_plan table has data
2. Verify GET /api/subscriptions/plans returns data
3. Check browser console for errors
4. Confirm API_BASE_URL is correct

### Issue: Can't change subscription plan
**Solution:**
1. Verify business_owner_subscription record exists for user
2. Check if planId is being sent in request body
3. Confirm POST /api/subscriptions/change-plan endpoint is accessible
4. Check backend logs for SQL errors

---

## Success Criteria

All tests pass when:
- ✅ No 500 errors on any endpoint
- ✅ No 403 errors for stall_business_owner on GET requests
- ✅ Multi-branch data returned correctly for business owners
- ✅ Subscription UI displays all plans
- ✅ Plan changes save successfully
- ✅ View-only protection still works (POST/PUT/DELETE blocked)

---

**Ready to Test!** Follow the tests in order and report any failures with:
1. Endpoint URL
2. HTTP status code
3. Error message
4. User role being tested
