# Vendor ID Field Implementation

**Date**: January 13, 2026  
**Feature**: Add Vendor ID field to display `vendor_identifier` across vendor components

## Overview

Added "Vendor ID" field to display the `vendor_identifier` database column in all vendor-related dialogs. This field shows the unique vendor identifier assigned to each vendor.

## Database Schema

The `vendor_identifier` field already exists in the database:

- **Column**: `vendor_identifier`
- **Type**: `varchar(45)`
- **Table**: `vendor`
- **Nullable**: Yes (DEFAULT NULL)

## Components Modified

### 1. VendorDetailsDialog.vue ✅

**Location**: `Frontend/Web/src/components/Admin/Vendors/Components/VendorDetailsDialog/`

**Changes**:

- Added "VENDOR ID" field in Business Information tab (right column)
- Positioned between "ASSIGNED LOCATION" and "VENDING TIME"
- Displays: `d.vendor_identifier || 'N/A'`

**Display Structure**:

```
Business Information
├── Left Column
│   ├── BUSINESS NAME
│   ├── BUSINESS TYPE
│   └── PRODUCTS SOLD
└── Right Column
    ├── ASSIGNED LOCATION
    ├── VENDOR ID (NEW)
    └── VENDING TIME
```

### 2. EditVendorDialog.vue ✅

**Location**: `Frontend/Web/src/components/Admin/Vendors/Components/EditVendorDialog/`

**Changes**:

- Added "Vendor ID" input field in Business Info tab
- Changed layout from single column to 2-column row for location and vendor ID
- Field properties:
  - Label: "Vendor ID"
  - Model: `form.vendorId`
  - Icon: `mdi-identifier`
  - Density: `compact`
  - Outlined style

**Form Structure**:

```vue
<v-row dense>
  <v-col cols="12" md="6">
    <v-text-field label="Assigned Location" v-model="form.locationName" />
  </v-col>
  <v-col cols="12" md="6">
    <v-text-field label="Vendor ID" v-model="form.vendorId" /> <!-- NEW -->
  </v-col>
</v-row>
```

### 3. AddVendorDialog.vue ✅ (Already Implemented)

**Location**: `Frontend/Web/src/components/Admin/Vendors/Components/AddVendorDialog/`

**Status**: Already has Vendor ID field

- Field exists at line 308
- Model: `form.vendorId`
- Maps to: `vendorIdentifier` in API payload

## Backend Integration

### Controller Mapping

**File**: `Backend/Backend-Web/controllers/vendors/vendorController.js`

The backend already handles `vendor_identifier`:

```javascript
// CREATE
const { vendorIdentifier } = req.body;
// Maps to p_vendor_identifier in stored procedure

// UPDATE
const { vendorIdentifier } = req.body;
// Maps to p_vendor_identifier in updateVendorWithRelations
```

### Stored Procedures

**File**: `database/migrations/404_vendor_relations_procedures.sql`

All procedures already support vendor_identifier:

1. **createVendorWithRelations**

   - Parameter: `p_vendor_identifier VARCHAR(45)`
   - Inserts into: `vendor.vendor_identifier`

2. **updateVendorWithRelations**

   - Parameter: `p_vendor_identifier VARCHAR(45)`
   - Updates: `vendor_identifier = p_vendor_identifier`

3. **getVendorWithRelations**

   - Returns: `v.vendor_identifier`

4. **getAllVendorsWithRelations**
   - Note: Currently does NOT return vendor_identifier in list view
   - Only returns: vendor_id, first_name, last_name, business_name, location_name, etc.

## Data Flow

### Edit Vendor Flow

```
1. User opens Edit Vendor dialog
2. EditVendorDialog.js populates form:
   f.vendorId = src.vendor_identifier || src.vendorId || src.vendor_id || ''
3. User edits vendor ID field
4. On submit, payload includes:
   vendorIdentifier: form.vendorId
5. Backend calls updateVendorWithRelations(p_vendor_identifier)
6. Database updates vendor.vendor_identifier
```

### View Vendor Flow

```
1. User clicks row to view vendor details
2. Vendors.js calls API: GET /vendors/${id}
3. Backend calls getVendorWithRelations(vendor_id)
4. Returns vendor object including vendor_identifier
5. VendorDetailsDialog displays:
   VENDOR ID: {{ d.vendor_identifier || 'N/A' }}
```

### Add Vendor Flow

```
1. User fills Add Vendor form
2. Enters Vendor ID (optional)
3. On submit, payload includes:
   vendorIdentifier: form.vendorId
4. Backend calls createVendorWithRelations(p_vendor_identifier)
5. Database inserts into vendor.vendor_identifier
```

## Component Dependencies

### EditVendorDialog.js

```javascript
data() {
  return {
    form: {
      vendorId: '', // Field exists
      // ... other fields
    }
  }
}

// Populate from source data
populateForm(src) {
  f.vendorId = src.vendor_identifier || src.vendorId || src.vendor_id || ''
}

// Submit payload
async submitVendor() {
  const payload = {
    vendorIdentifier: form.vendorId,
    // ... other fields
  }
}
```

### AddVendorDialog.js

```javascript
data() {
  return {
    form: {
      vendorId: '', // Field exists
      // ... other fields
    }
  }
}

// Submit payload
async submitVendor() {
  const payload = {
    vendorIdentifier: this.form.vendorId,
    // ... other fields
  }
}
```

### VendorDetailsDialog.js

```javascript
// Uses computed property
const d = computed(() => props.data || {});

// Access vendor_identifier
d.value.vendor_identifier;
```

## Testing Checklist

- [x] Verify VendorDetailsDialog displays vendor_identifier in Business tab
- [x] Verify EditVendorDialog shows vendor_identifier in editable field
- [x] Verify AddVendorDialog has vendor ID input field (already exists)
- [ ] Test creating vendor with vendor ID
- [ ] Test updating vendor with vendor ID
- [ ] Test viewing vendor with vendor ID
- [ ] Verify vendor_identifier persists in database after create/update
- [ ] Test with NULL vendor_identifier (should display "N/A")
- [ ] Test with existing vendor data (like "VEN2026-001")

## Notes

1. **Consistency**: All three dialogs (Add/Edit/View) now have vendor ID field
2. **Optional Field**: vendor_identifier is nullable in database
3. **Display Format**:
   - View mode: Shows "N/A" if null
   - Edit mode: Shows empty string if null
4. **Icon**: Uses `mdi-identifier` icon for consistency
5. **Layout**: Placed logically near location field in Business Info section

## Future Enhancements

1. **Auto-generation**: Consider auto-generating vendor_identifier (e.g., "VEN2026-XXX")
2. **Validation**: Add uniqueness validation for vendor_identifier
3. **List View**: Add vendor_identifier to getAllVendorsWithRelations query
4. **Search**: Enable searching vendors by vendor_identifier
5. **Required Field**: Consider making vendor_identifier required for better tracking

## Related Files

- `Frontend/Web/src/components/Admin/Vendors/Components/VendorDetailsDialog/VendorDetailsDialog.vue`
- `Frontend/Web/src/components/Admin/Vendors/Components/EditVendorDialog/EditVendorDialog.vue`
- `Frontend/Web/src/components/Admin/Vendors/Components/EditVendorDialog/EditVendorDialog.js`
- `Frontend/Web/src/components/Admin/Vendors/Components/AddVendorDialog/AddVendorDialog.vue`
- `Frontend/Web/src/components/Admin/Vendors/Components/AddVendorDialog/AddVendorDialog.js`
- `Backend/Backend-Web/controllers/vendors/vendorController.js`
- `database/migrations/404_vendor_relations_procedures.sql`

## Conclusion

Successfully implemented Vendor ID field across all vendor dialogs with complete integration from frontend to database. The field is now visible in:

- ✅ View mode (VendorDetailsDialog - Business tab)
- ✅ Edit mode (EditVendorDialog - Business Info tab)
- ✅ Create mode (AddVendorDialog - Business Info tab)

All components properly map to `vendor_identifier` in the database through the existing stored procedures.
