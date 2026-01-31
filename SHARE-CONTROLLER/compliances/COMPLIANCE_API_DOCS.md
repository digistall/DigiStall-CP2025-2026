# Compliance Management API Documentation

## Overview
The Compliance Management API provides endpoints for managing compliance/violation records in the Naga Stall Management System. This includes tracking violations, inspections, stallholder compliance status, and resolution tracking.

## Base URL
```
http://localhost:3001/api/compliances
```

## Authentication
All endpoints require JWT authentication token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Permissions
Most endpoints require the user to have the `compliances` permission.
- **Admins**: Full access to all endpoints
- **Branch Managers**: Access to their branch's compliance records
- **Employees**: Access based on permissions (require `compliances` permission)

---

## Endpoints

### 1. Get All Compliance Records
**GET** `/api/compliances`

Retrieve all compliance records with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by status - `pending`, `in-progress`, `complete`, `incomplete`, or `all`
- `search` (optional): Search by ID, type, inspector name, or stallholder name
- `branch_id` (optional): Filter by branch ID (admin only)

**Response:**
```json
{
  "success": true,
  "message": "Compliance records retrieved successfully",
  "data": [
    {
      "compliance_id": 1,
      "date": "2025-10-08 09:30:41",
      "type": "Illegal Vending",
      "inspector": "Ye Zhu",
      "stallholder": "Laurente, Jeno Aldrei",
      "status": "complete",
      "severity": "minor",
      "notes": "First warning issued. | Offense #1 | Fine: ₱300.00",
      "resolved_date": "2025-10-15 10:00:00",
      "branch_name": "Naga City Peoples Mall",
      "branch_id": 1,
      "stall_no": "NPM-001",
      "offense_no": 1,
      "penalty_amount": 300.00,
      "stallholder_id": 1,
      "stall_id": 50,
      "inspector_id": 2,
      "violation_id": 1
    }
  ],
  "count": 1
}
```

---

### 2. Get Single Compliance Record
**GET** `/api/compliances/:id`

Retrieve detailed information about a specific compliance record.

**Parameters:**
- `id`: Compliance record ID

**Response:**
```json
{
  "success": true,
  "message": "Compliance record retrieved successfully",
  "data": {
    "compliance_id": 1,
    "date": "2025-10-08 09:30:41",
    "type": "Illegal Vending",
    "inspector": "Ye Zhu",
    "stallholder": "Laurente, Jeno Aldrei",
    "status": "complete",
    "severity": "minor",
    "notes": "First warning issued.",
    "resolved_date": "2025-10-15 10:00:00",
    "branch_name": "Naga City Peoples Mall",
    "stall_no": "NPM-001",
    "offense_no": 1,
    "penalty_amount": 300.00
  }
}
```

---

### 3. Create Compliance Record
**POST** `/api/compliances`

Create a new compliance/violation record.

**Request Body:**
```json
{
  "inspector_id": 2,
  "stallholder_id": 1,
  "violation_id": 1,
  "stall_id": 50,
  "compliance_type": "Sanitary Issue",
  "severity": "moderate",
  "remarks": "Found unsanitary conditions in food preparation area",
  "offense_no": 1,
  "penalty_id": 1
}
```

**Field Descriptions:**
- `inspector_id` (optional): Inspector who reported the violation
- `stallholder_id` (required): Stallholder ID
- `violation_id` (optional): Violation type ID (from violations table)
- `stall_id` (optional): Stall ID where violation occurred
- `compliance_type` (required if no violation_id): Custom compliance type description
- `severity` (optional): `minor`, `moderate`, `major`, or `critical` (default: `moderate`)
- `remarks` (optional): Additional notes
- `offense_no` (optional): Offense number (1st, 2nd, 3rd, etc.) - default: 1
- `penalty_id` (optional): Penalty ID (auto-calculated if violation_id provided)

**Response:**
```json
{
  "success": true,
  "message": "Compliance record created successfully",
  "data": {
    "compliance_id": 3,
    "date": "2025-11-16 10:30:00",
    "type": "Sanitary Issue",
    "status": "pending",
    "severity": "moderate"
  }
}
```

---

### 4. Update Compliance Record
**PUT** `/api/compliances/:id`

Update an existing compliance record (status, remarks, resolution).

**Parameters:**
- `id`: Compliance record ID

**Request Body:**
```json
{
  "status": "in-progress",
  "remarks": "Stallholder has been notified. Correction in progress."
}
```

**Valid Status Values:**
- `pending`: Issue reported, not yet addressed
- `in-progress`: Currently being resolved
- `complete`: Issue resolved successfully
- `incomplete`: Issue not resolved or recurring

**Response:**
```json
{
  "success": true,
  "message": "Compliance record updated successfully",
  "data": {
    "compliance_id": 3,
    "status": "in-progress",
    "remarks": "Stallholder has been notified. Correction in progress."
  }
}
```

**Note:** When status is changed to `complete`, the system automatically:
- Sets `resolved_date` to current timestamp
- Records who resolved it (`resolved_by`)
- Updates stallholder's overall `compliance_status` if no other pending violations

---

### 5. Delete Compliance Record
**DELETE** `/api/compliances/:id`

Delete a compliance record. **Admin and Branch Manager only.**

**Parameters:**
- `id`: Compliance record ID

**Response:**
```json
{
  "success": true,
  "message": "Compliance record deleted successfully"
}
```

---

### 6. Get Compliance Statistics
**GET** `/api/compliances/statistics`

Get summary statistics of compliance records.

**Response:**
```json
{
  "success": true,
  "message": "Compliance statistics retrieved successfully",
  "data": {
    "total_records": 50,
    "pending_count": 12,
    "in_progress_count": 8,
    "complete_count": 28,
    "incomplete_count": 2,
    "critical_count": 3,
    "major_count": 7
  }
}
```

---

### 7. Get All Inspectors
**GET** `/api/compliances/helpers/inspectors`

Get list of all active inspectors.

**Response:**
```json
{
  "success": true,
  "message": "Inspectors retrieved successfully",
  "data": [
    {
      "inspector_id": 2,
      "inspector_name": "Ye Zhu",
      "first_name": "Ye",
      "last_name": "Zhu",
      "email": "yezhu@city.gov",
      "contact_no": "09171231234",
      "status": "active",
      "date_hired": "2025-10-02"
    }
  ]
}
```

---

### 8. Get All Violation Types
**GET** `/api/compliances/helpers/violations`

Get list of all violation types.

**Response:**
```json
{
  "success": true,
  "message": "Violation types retrieved successfully",
  "data": [
    {
      "violation_id": 1,
      "ordinance_no": "Ordinance No. 2001-055",
      "violation_type": "Illegal Vending",
      "details": "Vending outside prescribed area (Obstruction)"
    },
    {
      "violation_id": 2,
      "ordinance_no": "Ordinance No. 2001-056",
      "violation_type": "Waste Segregation / Anti-Littering",
      "details": "Improper waste disposal or littering"
    }
  ]
}
```

---

### 9. Get Violation Penalties
**GET** `/api/compliances/helpers/violations/:violationId/penalties`

Get penalties for a specific violation type.

**Parameters:**
- `violationId`: Violation ID

**Response:**
```json
{
  "success": true,
  "message": "Penalties retrieved successfully",
  "data": [
    {
      "penalty_id": 1,
      "violation_id": 1,
      "offense_no": 1,
      "penalty_amount": 300.00,
      "remarks": null
    },
    {
      "penalty_id": 2,
      "violation_id": 1,
      "offense_no": 2,
      "penalty_amount": 500.00,
      "remarks": null
    },
    {
      "penalty_id": 3,
      "violation_id": 1,
      "offense_no": 3,
      "penalty_amount": 1000.00,
      "remarks": null
    },
    {
      "penalty_id": 4,
      "violation_id": 1,
      "offense_no": 4,
      "penalty_amount": 0.00,
      "remarks": "Cancellation of Permit"
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development mode)"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created successfully
- `400`: Bad request (validation error)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Internal server error

---

## Usage Examples

### JavaScript (Axios)
```javascript
// Get all compliance records
const response = await axios.get('http://localhost:3001/api/compliances', {
  headers: {
    'Authorization': `Bearer ${token}`
  },
  params: {
    status: 'pending',
    search: 'sanitary'
  }
});

// Create new compliance record
const newRecord = await axios.post('http://localhost:3001/api/compliances', {
  stallholder_id: 1,
  compliance_type: 'Fire Safety',
  severity: 'major',
  remarks: 'Missing fire extinguisher'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Update compliance status
const updated = await axios.put(`http://localhost:3001/api/compliances/${id}`, {
  status: 'complete',
  remarks: 'Issue resolved - fire extinguisher installed'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Database Schema

### Enhanced violation_report Table
```sql
CREATE TABLE violation_report (
  report_id INT PRIMARY KEY AUTO_INCREMENT,
  inspector_id INT,
  stallholder_id INT,
  violation_id INT,
  stall_id INT,
  branch_id INT,
  compliance_type VARCHAR(100),
  severity ENUM('minor', 'moderate', 'major', 'critical'),
  evidence BLOB,
  date_reported DATETIME,
  remarks TEXT,
  status ENUM('pending', 'in-progress', 'complete', 'incomplete'),
  resolved_date DATETIME,
  resolved_by INT,
  offense_no INT,
  penalty_id INT
);
```

---

## Migration Instructions

1. **Run the database migration:**
   ```bash
   mysql -u root -p naga_stall < database/migrations/022_compliance_system_enhancement.sql
   ```

2. **Verify migration:**
   ```sql
   SELECT * FROM migrations WHERE migration_name = '022_compliance_system_enhancement';
   ```

3. **Test the new stored procedures:**
   ```sql
   CALL getAllComplianceRecords(NULL, 'all', '');
   CALL getComplianceStatistics(NULL);
   ```

---

## Notes

- Compliance records automatically update stallholder compliance status
- When a violation is marked as `complete`, the system checks if the stallholder has any other pending violations
- If no pending violations remain, stallholder status is automatically updated to `Compliant`
- Branch managers and employees can only access compliance records for their assigned branch
- Admins have full access to all branches

---

## Support

For issues or questions, contact the development team or refer to the main project documentation.
