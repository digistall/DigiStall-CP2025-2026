# Stallholder Excel Import Guide

## Overview

This guide explains how to use the Excel Import feature to migrate existing stallholder data from your previous system (e.g., the company's existing Excel records) into the DigiStall system.

## How It Works

1. **Download Template** - Download the Excel template from the system
2. **Fill in Data** - Enter stallholder and stall information
3. **Preview** - System validates the data before import
4. **Import** - Validated records are imported into the database

## Excel Template Columns

Based on the database schema (`stallholder` and `stall` tables), the template includes:

### Required Fields (Must be filled)
| Column | Description | Example |
|--------|-------------|---------|
| **STALL NO.** | Unique stall identifier | B1-S1, NPM-001 |
| **STALLHOLDER NAME** | Full name of stallholder | Juan Dela Cruz |
| **MONTHLY RENT** | Monthly rental amount (PHP) | 4996.92 |
| **CONTRACT START** | Start date (YYYY-MM-DD) | 2025-01-01 |
| **CONTRACT END** | End date (YYYY-MM-DD) | 2026-01-01 |

### Rental Calculation Fields (From Company's Existing Records)
These fields match the company's existing Excel format:

| Column | Description | Example |
|--------|-------------|---------|
| **AREA OCCUPIED (sqm)** | Total area in square meters | 17.16 |
| **RATE PER SQ. METER** | Rate per sqm | 388.26 |
| **DISCOUNTED RATE** | Early payment discount | 3747.69 |
| **LEASE AMOUNT** | Total lease amount | 4996.92 |

> **Note:** If MONTHLY RENT is not provided, it will be calculated as:  
> `MONTHLY RENT = AREA OCCUPIED × RATE PER SQ. METER`

### Optional Fields
| Column | Description | Example |
|--------|-------------|---------|
| CONTACT NUMBER | Phone number | 09123456789 |
| EMAIL | Email address | sample@email.com |
| ADDRESS | Complete address | Zone 5, Naga City |
| BUSINESS NAME | Name of business | Juan's Store |
| BUSINESS TYPE | Type/nature of business | PILI PASALUBONG, GEN. MERCHANDISE |
| FLOOR | Floor location | GROUND FLOOR |
| SECTION | Section name | Meat Shop |
| STALL LOCATION | Specific location | Near Main Entrance |
| STALL SIZE | Dimensions | 3x4, 4x5 |
| NOTES | Additional notes | Premium location |

## Mapping from Company's Existing Format

The system automatically maps columns from the company's existing Excel format:

| Existing Column | Maps To |
|-----------------|---------|
| B/S NO. | STALL NO. |
| REGISTERED NAME | STALLHOLDER NAME |
| NEW AREA OCCUPIED | AREA OCCUPIED (sqm) |
| RATE PER SQ. METER | RATE PER SQ. METER |
| DISCOUNTED | DISCOUNTED RATE / MONTHLY RENT |
| NATURE OF BUSSINESS 2025 | BUSINESS TYPE |

## Data Flow in Database

When importing:

1. **Stall Creation**
   - If `STALL NO.` doesn't exist → Creates new stall in `stall` table
   - If `STALL NO.` exists → Updates stall rental price and marks as occupied

2. **Stallholder Creation**
   - Creates record in `stallholder` table
   - Links to stall via `stall_id`
   - Sets initial `payment_status` to 'pending'
   - Sets `contract_status` to 'Active'

3. **Floor/Section**
   - If floor doesn't exist → Creates new floor
   - If section doesn't exist → Creates new section

## Database Tables Affected

### `stallholder` Table
```sql
- stallholder_id (auto-generated)
- stallholder_name (from Excel)
- contact_number (from Excel)
- email (from Excel)
- address (from Excel)
- business_name (from Excel)
- business_type (from Excel)
- branch_id (from logged-in user)
- stall_id (linked to created/existing stall)
- contract_start_date (from Excel)
- contract_end_date (from Excel)
- lease_amount (from Excel)
- monthly_rent (from Excel)
- payment_status (default: 'pending')
- notes (from Excel + area/rate info)
```

### `stall` Table
```sql
- stall_id (auto-generated for new)
- stall_no (from Excel)
- section_id (from floor/section)
- floor_id (from floor name)
- stall_location (from Excel)
- size (from Excel)
- rental_price (from monthly_rent)
- status ('Occupied' after import)
- is_available (0 after import)
```

## Step-by-Step Import Process

### 1. Access Excel Import
- Login as Manager, Owner, or Employee
- Go to Stallholders page
- Click the "+" FAB button
- Select "Import from Excel"

### 2. Download Template
- Click "Download Template" button
- Template has 3 sheets:
  - **Stallholder Data** - Main data sheet
  - **Instructions** - Detailed guide
  - **Reference Data** - Available branches, floors, sections

### 3. Fill Data
- Delete the sample row first
- Enter one stallholder per row
- Fill required fields at minimum
- Save as .xlsx or .xls

### 4. Upload and Preview
- Select your filled Excel file
- Click "Next: Preview Data"
- Review validation results:
  - ✅ Green = Valid records (will be imported)
  - ❌ Red = Invalid records (need correction)
  - 🔵 Blue stall chip = Existing stall
  - 🟢 Green stall chip = New stall to be created

### 5. Import Data
- Review the summary:
  - Total Records
  - Valid Records  
  - New Stalls (to be created)
  - Invalid Records
- Click "Import X Records"
- Wait for completion

### 6. Results
- Success message with counts
- Refresh stallholder list to see imported data

## Troubleshooting

### Common Validation Errors

| Error | Solution |
|-------|----------|
| "STALL NO. is required" | Fill in stall number |
| "STALLHOLDER NAME is required" | Fill in stallholder name |
| "MONTHLY RENT is required" | Fill in monthly rent OR area occupied + rate per sqm |
| "Email already exists" | Use different email or leave blank |

### Tips
- Ensure dates are in YYYY-MM-DD format
- Don't use currency symbols (₱) in amounts
- Remove the sample row before importing
- Check the Reference Data sheet for valid floor/section names

## Security Notes

- Only authenticated users can import
- Data is validated before import
- Transactions are atomic (all succeed or all fail)
- Uploaded files are deleted after processing

## Related Files

- Backend Controller: `Backend/Backend-Web/controllers/stallholders/stallholderController.js`
- Routes: `Backend/Backend-Web/routes/stallholderRoutes.js`
- Frontend Component: `Frontend/Web/src/components/Admin/Stallholders/Components/ExcelImport/`
- Database Schema: `database/naga_stall.sql`
