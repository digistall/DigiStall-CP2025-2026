# 🔧 StallImageManager Integration Guide

## ✅ Errors Fixed

1. **Removed unused `event` parameter** from `handleFileSelection` method
2. **Replaced `axios` with `apiClient`** for proper API configuration
3. **Updated API URLs** to use relative paths (apiClient handles baseURL)
4. **Removed manual token handling** (apiClient handles authentication automatically)

---

## 📝 How to Integrate StallImageManager into EditStall.vue

### Option 1: Add as a Tab (Recommended)

```vue
<template>
  <v-dialog v-model="showModal" max-width="1000px" persistent>
    <v-card>
      <v-card-title>
        <!-- Your existing header -->
      </v-card-title>

      <v-divider></v-divider>

      <!-- Add Tabs -->
      <v-tabs v-model="activeTab">
        <v-tab>Stall Details</v-tab>
        <v-tab>Images</v-tab>
      </v-tabs>

      <v-tabs-window v-model="activeTab">
        <!-- Tab 1: Existing Stall Form -->
        <v-tabs-window-item>
          <v-card-text class="pa-6">
            <v-form ref="editForm" v-model="valid" lazy-validation>
              <!-- Your existing form fields -->
            </v-form>
          </v-card-text>
        </v-tabs-window-item>

        <!-- Tab 2: Image Manager -->
        <v-tabs-window-item>
          <v-card-text class="pa-6">
            <StallImageManager
              v-if="editForm.stall_id && editForm.branch_id && editForm.stallNumber"
              :stall-id="editForm.stall_id"
              :branch-id="editForm.branch_id"
              :stall-number="editForm.stallNumber"
              :readonly="isBusinessOwner"
              @success="handleImageSuccess"
              @error="handleImageError"
            />
            <v-alert v-else type="info">
              Please save the stall first before uploading images.
            </v-alert>
          </v-card-text>
        </v-tabs-window-item>
      </v-tabs-window>

      <v-divider></v-divider>

      <!-- Your existing actions -->
      <v-card-actions>
        <!-- Your existing buttons -->
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./EditStall.js"></script>
```

### Update EditStall.js

```javascript
import StallImageManager from '../StallImageManager/StallImageManager.vue'

export default {
  name: 'EditStall',
  
  components: {
    StallImageManager,
    // ... other components
  },
  
  data() {
    return {
      activeTab: 0,
      // ... existing data
    }
  },
  
  methods: {
    handleImageSuccess(message) {
      // Show success notification
      this.$toast?.success(message) || console.log('✅', message)
    },
    
    handleImageError(error) {
      // Show error notification
      this.$toast?.error(error) || console.error('❌', error)
    },
    
    // ... existing methods
  }
}
```

---

## Option 2: Add as Expansion Panel

```vue
<template>
  <v-dialog v-model="showModal" max-width="1000px" persistent>
    <v-card>
      <v-card-title>
        <!-- Your existing header -->
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-6">
        <!-- Existing Form -->
        <v-form ref="editForm" v-model="valid" lazy-validation>
          <!-- Your existing form fields -->
        </v-form>

        <!-- Image Manager Expansion Panel -->
        <v-expansion-panels class="mt-6">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-icon class="me-2">mdi-image-multiple</v-icon>
                <span>Stall Images</span>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <StallImageManager
                v-if="editForm.stall_id"
                :stall-id="editForm.stall_id"
                :branch-id="editForm.branch_id"
                :stall-number="editForm.stallNumber"
                :readonly="isBusinessOwner"
                @success="handleImageSuccess"
                @error="handleImageError"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <!-- Your existing buttons -->
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

---

## Option 3: Separate Modal

```vue
<template>
  <div>
    <!-- Edit Stall Dialog (Existing) -->
    <v-dialog v-model="showModal" max-width="800px" persistent>
      <v-card>
        <!-- Your existing content -->
        
        <v-card-actions>
          <!-- Existing buttons -->
          
          <v-btn
            color="secondary"
            @click="openImageManager"
            prepend-icon="mdi-image-multiple"
          >
            Manage Images
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Image Manager Dialog (New) -->
    <v-dialog v-model="showImageManager" max-width="1200px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon class="me-2">mdi-image-multiple</v-icon>
            <span>Manage Stall Images</span>
          </div>
          <v-btn icon @click="showImageManager = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          <StallImageManager
            :stall-id="editForm.stall_id"
            :branch-id="editForm.branch_id"
            :stall-number="editForm.stallNumber"
            :readonly="isBusinessOwner"
            @success="handleImageSuccess"
            @error="handleImageError"
          />
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showImageManager = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showImageManager: false,
      // ... existing data
    }
  },
  
  methods: {
    openImageManager() {
      if (!this.editForm.stall_id) {
        this.$toast?.error('Please save the stall first') || 
          alert('Please save the stall first before managing images')
        return
      }
      this.showImageManager = true
    }
  }
}
</script>
```

---

## 🔧 Required Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `stall-id` | Number/String | ✅ Yes | The stall ID |
| `branch-id` | Number/String | ✅ Yes | The branch ID |
| `stall-number` | Number/String | ✅ Yes | The stall number |
| `readonly` | Boolean | ❌ No | Read-only mode (default: false) |

---

## 📡 Events Emitted

| Event | Payload | Description |
|-------|---------|-------------|
| `@success` | message (String) | Success notification message |
| `@error` | error (String) | Error notification message |

---

## 🎯 Usage Example

```vue
<StallImageManager
  :stall-id="123"
  :branch-id="1"
  :stall-number="25"
  :readonly="false"
  @success="(msg) => console.log('Success:', msg)"
  @error="(err) => console.error('Error:', err)"
/>
```

---

## ⚠️ Important Notes

1. **Save Stall First**: Make sure the stall is saved before allowing image uploads
2. **API Configuration**: The component uses `apiClient` which automatically handles:
   - Base URL from `VITE_API_URL` environment variable
   - Authentication tokens
   - Request/response interceptors

3. **Notifications**: Implement toast notifications for better UX:
   ```javascript
   handleImageSuccess(message) {
     this.$toast.success(message)
   }
   
   handleImageError(error) {
     this.$toast.error(error)
   }
   ```

4. **Read-only Mode**: Set `readonly` to `true` for Business Owners or view-only users

---

## ✅ Verification Checklist

- [ ] Component imported in EditStall.vue
- [ ] Props properly passed
- [ ] Event handlers implemented
- [ ] Toast notifications working
- [ ] Backend API endpoints accessible
- [ ] Database migration executed
- [ ] Upload directory created
- [ ] Images displaying correctly

---

**Status:** ✅ Component Ready to Use!
