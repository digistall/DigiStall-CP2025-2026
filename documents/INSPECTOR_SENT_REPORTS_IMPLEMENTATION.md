# Inspector Sent Reports Feature - Implementation Guide

## Overview
Replaced the Stalls screen with a Sent Reports screen that displays all violation reports submitted by the inspector.

## Files Modified

### 1. Frontend (Mobile)
**File**: `EMPLOYEE/FRONTEND-MOBILE/VIEWS/inspector/InspectorScreens/Stalls/StallsScreen.js`
- Renamed component to `SentReportsScreen`
- Added API integration to fetch inspector's sent reports
- Displays violation reports with:
  - Receipt number
  - Report date
  - Violation type
  - Stallholder information
  - Penalty amount
  - Payment status
  - Report status (Open/Resolved/Closed)
- Includes search and filter functionality (All/Open/Resolved/Paid)
- Pull-to-refresh support

### 2. API Service
**File**: `FRONTEND-RUNNER/MOBILE/services/ApiService.js`
- Added `getInspectorSentReports()` method
- Endpoint: `GET /api/mobile/inspector/sent-reports`

### 3. Backend Controller
**File**: `SHARE-CONTROLLER/inspector/inspectorController.js`
- Added `getInspectorSentReports()` function
- Calls stored procedure `sp_getInspectorSentReports`
- Returns decrypted stallholder names and full report details

### 4. Routes
**File**: `routes/inspectorRoutes.js`
- Added route: `GET /api/mobile/inspector/sent-reports`
- Protected with `verifyToken` middleware

### 5. Database - Stored Procedure
**File**: `DATABASE/STORED_PROCEDURES/sp_getInspectorSentReports.sql`
- Creates stored procedure `sp_getInspectorSentReports(inspector_id)`
- Joins violation_report, stallholder, violation, stall, and branch tables
- Returns complete report information with decrypted stallholder names
- Ordered by report_date DESC

## Database Setup

Run the stored procedure SQL file to create it in your database:

```sql
SOURCE D:/BB/DigiStall-CP2025-2026/DATABASE/STORED_PROCEDURES/sp_getInspectorSentReports.sql;
```

Or copy and paste the content into MySQL Workbench and execute.

## API Response Structure

```json
{
  "success": true,
  "message": "Sent reports retrieved successfully",
  "count": 10,
  "data": [
    {
      "report_id": 1,
      "receipt_number": 1234567,
      "stallholder_id": 5,
      "stallholder_name": "Juan Dela Cruz",
      "violation_id": 2,
      "violation_name": "Health Code Violation",
      "violation_description": "...",
      "report_date": "2026-02-05T10:30:00.000Z",
      "offense_count": 1,
      "penalty_amount": "5000.00",
      "payment_status": "Unpaid",
      "status": "Open",
      "stall_no": "A-001",
      "stall_location": "Ground Floor",
      "branch_name": "Naga City Public Market",
      "evidence": "...",
      "remarks": "...",
      ...
    }
  ]
}
```

## Features

### Search
Search by:
- Receipt number
- Stallholder name
- Violation type
- Stall number

### Filters
- **All**: Show all reports
- **Open**: Show only open/pending reports
- **Resolved**: Show resolved reports
- **Paid**: Show reports with paid penalties

### Card Display
Each report card shows:
- Receipt number badge
- Status badge (Open/Resolved/Closed)
- Report date
- Violation type (highlighted in red)
- Stall number (if applicable)
- Stallholder avatar and name
- Penalty amount
- Payment status badge (Paid/Unpaid/Partial)

## Testing

1. **Backend**: Restart the backend server
   ```powershell
   cd d:\BB\DigiStall-CP2025-2026
   node server.js
   ```

2. **Database**: Run the stored procedure SQL

3. **Mobile**: The screen will automatically load reports when opened

4. **Test Data**: Ensure your `violation_report` table has data with the current inspector's ID

## Notes

- The screen uses the inspector's ID from the auth token
- Reports are automatically sorted by report date (newest first)
- Pull-to-refresh reloads all reports
- Empty state shown when no reports exist
- Loading state displayed while fetching data
