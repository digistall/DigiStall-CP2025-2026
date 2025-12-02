# Toast Notification Migration Guide

This guide explains how to replace the old v-snackbar components with the new ToastNotification design across the entire web application.

## Toast Notification Component Location
`Frontend/Web/src/components/Common/ToastNotification/ToastNotification.vue`

## Migration Steps

### Step 1: Import ToastNotification

Add to the component's script section:
```javascript
import ToastNotification from '@/components/Common/ToastNotification/ToastNotification.vue'
```

Register in components:
```javascript
components: {
  ToastNotification,
  // ... other components
}
```

### Step 2: Update Data Properties

**OLD:**
```javascript
data() {
  return {
    showSnackbar: false,
    snackbarMessage: '',
    snackbarColor: 'success',
    // or
    showSuccess: false,
    showError: false,
    successMessage: '',
    errorMessage: '',
  }
}
```

**NEW:**
```javascript
data() {
  return {
    toast: {
      show: false,
      message: '',
      type: 'success', // success, update, delete, error, warning, info
    }
  }
}
```

### Step 3: Replace Template Code

**OLD:**
```vue
<v-snackbar v-model="showSuccess" color="success" timeout="3000" bottom>
  <v-icon left>mdi-check-circle</v-icon>
  {{ successMessage }}
  <template v-slot:action="{ attrs }">
    <v-btn text v-bind="attrs" @click="showSuccess = false">Close</v-btn>
  </template>
</v-snackbar>

<v-snackbar v-model="showError" color="error" timeout="5000" bottom>
  <v-icon left>mdi-alert-circle</v-icon>
  {{ errorMessage }}
  <template v-slot:action="{ attrs }">
    <v-btn text v-bind="attrs" @click="showError = false">Close</v-btn>
  </template>
</v-snackbar>
```

**NEW:**
```vue
<ToastNotification
  :show="toast.show"
  :message="toast.message"
  :type="toast.type"
  @close="toast.show = false"
/>
```

### Step 4: Update Methods

**OLD:**
```javascript
methods: {
  showSuccess() {
    this.successMessage = 'Operation successful!'
    this.showSuccess = true
  },
  showError() {
    this.errorMessage = 'Operation failed!'
    this.showError = true
  }
}
```

**NEW:**
```javascript
methods: {
  showToast(message, type = 'success') {
    this.toast = {
      show: true,
      message: message,
      type: type
    }
  }
}
```

Then call it like:
```javascript
// Success
this.showToast('✅ Operation successful!', 'success')

// Error
this.showToast('❌ Operation failed!', 'error')

// Update
this.showToast('📝 Updated successfully!', 'update')

// Delete
this.showToast('🗑️ Deleted successfully!', 'delete')

// Warning
this.showToast('⚠️ Warning message!', 'warning')

// Info
this.showToast('ℹ️ Information message!', 'info')
```

## Toast Types and Icons

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `success` | ✅ mdi-check-circle | Green | Add operations, successful saves |
| `update` | 📝 mdi-check-circle | Green | Update operations |
| `delete` | 🗑️ mdi-delete-circle | Red | Delete operations |
| `error` | ❌ mdi-alert-circle | Red | Errors, failures |
| `warning` | ⚠️ mdi-alert | Orange | Warnings, cautions |
| `info` | ℹ️ mdi-information | Blue | Information, tips |

## Files That Need Migration

### 1. Payment Components (HIGH PRIORITY)
- ✅ `Frontend/Web/src/components/Admin/Stalls/Stalls.vue` (Already done)
- ⏳ `Frontend/Web/src/components/Admin/Payment/Components/StallPayments/StallPayments.vue`
- ⏳ `Frontend/Web/src/components/Admin/Payment/Components/OnlinePayments/OnlinePayments.vue`
- ⏳ `Frontend/Web/src/components/Admin/Payment/Components/OnsitePayments/OnsitePayments.vue`

### 2. Stallholder Components
- ⏳ `Frontend/Web/src/components/Admin/Stallholders/Components/AddStallholder/AddStallholder.vue`
- ⏳ `Frontend/Web/src/components/Admin/Stallholders/Components/ExcelImport/ExcelImport.vue`
- ⏳ `Frontend/Web/src/components/Admin/Stallholders/Components/DocumentCustomization/DocumentCustomization.vue`

### 3. Vendor Components
- ⏳ `Frontend/Web/src/components/Admin/Vendors/Components/AddVendorDialog/AddVendorDialog.vue`

### 4. Collector Components
- ⏳ `Frontend/Web/src/components/Admin/Collectors/Components/AddCollectorDialog/AddCollectorDialog.vue`
- ⏳ `Frontend/Web/src/components/Admin/Collectors/Components/EditCollectorDialog/EditCollectorDialog.vue`

### 5. Raffle and Auction Components
- ⏳ `Frontend/Web/src/components/Admin/Stalls/RaffleComponents/RafflesPage.vue`
- ⏳ `Frontend/Web/src/components/Admin/Stalls/AuctionComponents/AuctionsPage/AuctionsPage.vue`

## Example: Complete Migration

### Before (AddVendorDialog.vue)

```vue
<template>
  <v-dialog>
    <!-- dialog content -->
    
    <v-snackbar v-model="showSuccess" color="success" timeout="3000" bottom>
      <v-icon left>mdi-check-circle</v-icon>
      {{ successMessage }}
    </v-snackbar>
    
    <v-snackbar v-model="showError" color="error" timeout="5000" bottom>
      <v-icon left>mdi-alert-circle</v-icon>
      {{ errorMessage }}
    </v-snackbar>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      showSuccess: false,
      showError: false,
      successMessage: '',
      errorMessage: '',
    }
  },
  methods: {
    async saveVendor() {
      try {
        // save logic
        this.successMessage = 'Vendor added successfully!'
        this.showSuccess = true
      } catch (error) {
        this.errorMessage = 'Failed to add vendor'
        this.showError = true
      }
    }
  }
}
</script>
```

### After (AddVendorDialog.vue)

```vue
<template>
  <v-dialog>
    <!-- dialog content -->
    
    <ToastNotification
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </v-dialog>
</template>

<script>
import ToastNotification from '@/components/Common/ToastNotification/ToastNotification.vue'

export default {
  components: {
    ToastNotification
  },
  data() {
    return {
      toast: {
        show: false,
        message: '',
        type: 'success'
      }
    }
  },
  methods: {
    showToast(message, type = 'success') {
      this.toast = {
        show: true,
        message: message,
        type: type
      }
    },
    async saveVendor() {
      try {
        // save logic
        this.showToast('✅ Vendor added successfully!', 'success')
      } catch (error) {
        this.showToast('❌ Failed to add vendor', 'error')
      }
    }
  }
}
</script>
```

## Benefits

1. **Consistent Design** - Same look and feel across all pages
2. **Better UX** - Subtle, non-intrusive notifications
3. **Cleaner Code** - Less boilerplate, simpler to use
4. **Modern Design** - Slide-in animation from bottom-right
5. **Mobile Responsive** - Adapts to small screens
6. **Icon Support** - Automatic icons based on type

## Testing Checklist

After migration, test each component:
- [ ] Success messages display correctly
- [ ] Error messages display correctly
- [ ] Toast auto-dismisses after 3 seconds
- [ ] Toast can be manually closed
- [ ] Multiple toasts don't overlap
- [ ] Mobile view works correctly
- [ ] Icons display correctly
- [ ] Colors match the type

## Need Help?

See the Stalls component for a complete working example:
- `Frontend/Web/src/components/Admin/Stalls/Stalls.vue`
- `Frontend/Web/src/components/Admin/Stalls/Stalls.js`
