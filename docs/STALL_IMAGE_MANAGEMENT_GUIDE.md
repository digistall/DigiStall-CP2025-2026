# Stall Image Management System - Implementation Guide

## 📋 Overview

This implementation provides a complete multi-image upload system for stalls with the following capabilities:
- Upload up to **10 images per stall**
- Each image limited to **2MB** (PNG/JPG only)
- Images stored in organized directory structure: `/digistall_uploads/stalls/{branch_id}/{stall_number}/`
- Automatic folder creation
- Primary image designation
- Image management (upload, delete, reorder)

---

## 🗄️ Database Setup

### Step 1: Run the Migration

Execute the SQL migration file to create the necessary table and stored procedures:

```bash
# Location: database/migrations/create_stall_images_table.sql
```

**Execute in MySQL:**
```sql
SOURCE C:/Users/Jeno/DigiStall-CP2025-2026/database/migrations/create_stall_images_table.sql;
```

**Or via MySQL Workbench:**
1. Open MySQL Workbench
2. Connect to your database
3. Open the migration file
4. Execute the script

### Step 2: Verify Table Creation

```sql
-- Check if table was created
SHOW TABLES LIKE 'stall_images';

-- View table structure
DESCRIBE stall_images;

-- Check stored procedures
SHOW PROCEDURE STATUS WHERE Db = 'naga_stall' AND Name LIKE 'sp_%StallImage%';
```

---

## 🔧 Backend Implementation

### Components Created

1. **Multer Configuration** (`Backend/Backend-Web/config/multerStallImages.js`)
   - Dynamic folder creation
   - File validation (type, size)
   - Automatic filename generation (1.jpg, 2.jpg, etc.)
   - 10 image limit enforcement

2. **Image Controller** (`Backend/Backend-Web/controllers/stalls/stallImageController.js`)
   - `uploadStallImages` - Upload multiple images
   - `getStallImages` - Retrieve all images for a stall
   - `deleteStallImage` - Delete specific image
   - `setStallPrimaryImage` - Set primary/featured image
   - `getStallImageCount` - Get current image count

3. **Routes** (Updated `Backend/Backend-Web/routes/stallRoutes.js`)
   ```javascript
   POST   /api/stalls/:stall_id/images/upload      // Upload images
   GET    /api/stalls/:stall_id/images             // Get all images
   GET    /api/stalls/:stall_id/images/count       // Get count
   DELETE /api/stalls/images/:image_id             // Delete image
   PUT    /api/stalls/images/:image_id/set-primary // Set primary
   ```

---

## 🎨 Frontend Implementation

### Vue Component Created

**StallImageManager Component**
```
Frontend/Web/src/components/Admin/Stalls/StallsComponents/StallImageManager/StallImageManager.vue
```

**Features:**
- Multi-file upload with preview
- Image gallery with grid layout
- Primary image badge
- Delete confirmation dialog
- Real-time upload progress
- Image count display (X/10)
- Drag & drop support
- Responsive design

### Usage in EditStall.vue

Add the image manager to your existing EditStall component:

```vue
<template>
  <v-dialog v-model="showModal" max-width="1200px">
    <v-card>
      <!-- ... existing code ... -->
      
      <!-- Add Image Manager Tab or Section -->
      <v-tabs v-model="activeTab">
        <v-tab>Stall Details</v-tab>
        <v-tab>Images</v-tab>
      </v-tabs>
      
      <v-tabs-window v-model="activeTab">
        <v-tabs-window-item>
          <!-- Existing form fields -->
        </v-tabs-window-item>
        
        <v-tabs-window-item>
          <StallImageManager
            :stall-id="editForm.stall_id"
            :branch-id="editForm.branch_id"
            :stall-number="editForm.stallNumber"
            :readonly="isBusinessOwner"
            @success="handleImageSuccess"
            @error="handleImageError"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>
  </v-dialog>
</template>

<script>
import StallImageManager from './StallImageManager/StallImageManager.vue'

export default {
  components: {
    StallImageManager
  },
  
  data() {
    return {
      activeTab: 0
    }
  },
  
  methods: {
    handleImageSuccess(message) {
      // Show success notification
      console.log('Success:', message)
    },
    
    handleImageError(error) {
      // Show error notification
      console.error('Error:', error)
    }
  }
}
</script>
```

---

## 📁 Directory Structure

Images are stored in the following structure:

```
C:/xampp/htdocs/digistall_uploads/stalls/
├── 1/                          # Branch ID
│   ├── 25/                     # Stall Number
│   │   ├── 1.jpg              # Image 1
│   │   ├── 2.jpg              # Image 2
│   │   └── 3.jpg              # Image 3
│   └── 26/
│       ├── 1.jpg
│       └── 2.jpg
└── 2/
    └── 10/
        ├── 1.jpg
        ├── 2.jpg
        └── 3.jpg
```

**Image URLs:**
```
http://localhost/digistall_uploads/stalls/1/25/1.jpg
http://localhost/digistall_uploads/stalls/1/25/2.jpg
```

---

## 🔐 API Endpoints

### 1. Upload Images

**Endpoint:** `POST /api/stalls/:stall_id/images/upload`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (FormData):**
```javascript
{
  images: [File, File, ...],  // Array of image files (max 10)
  stall_id: 123,
  branch_id: 1,
  stall_number: 25,
  is_primary: "true"          // Set first image as primary
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully uploaded 3 image(s)",
  "data": {
    "images": [
      {
        "id": 1,
        "stall_id": 123,
        "image_url": "http://localhost/digistall_uploads/stalls/1/25/1.jpg",
        "filename": "1.jpg",
        "display_order": 1,
        "is_primary": 1,
        "created_at": "2025-12-07T10:30:00"
      }
    ],
    "total_images": 3
  }
}
```

### 2. Get All Images

**Endpoint:** `GET /api/stalls/:stall_id/images`

**Response:**
```json
{
  "success": true,
  "message": "Images retrieved successfully",
  "data": {
    "images": [...],
    "total": 3
  }
}
```

### 3. Delete Image

**Endpoint:** `DELETE /api/stalls/images/:image_id`

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": {
    "deleted_image_id": 1
  }
}
```

### 4. Set Primary Image

**Endpoint:** `PUT /api/stalls/images/:image_id/set-primary`

**Response:**
```json
{
  "success": true,
  "message": "Primary image updated successfully",
  "data": {
    "primary_image_id": 2
  }
}
```

### 5. Get Image Count

**Endpoint:** `GET /api/stalls/:stall_id/images/count`

**Response:**
```json
{
  "success": true,
  "message": "Image count retrieved successfully",
  "data": {
    "current": 5,
    "remaining": 5,
    "max": 10
  }
}
```

---

## 🧪 Testing

### Using Postman

1. **Upload Images:**
   ```
   POST http://localhost:5000/api/stalls/123/images/upload
   
   Headers:
   - Authorization: Bearer <your_token>
   
   Body (form-data):
   - images: [select multiple files]
   - stall_id: 123
   - branch_id: 1
   - stall_number: 25
   - is_primary: true
   ```

2. **Get Images:**
   ```
   GET http://localhost:5000/api/stalls/123/images
   
   Headers:
   - Authorization: Bearer <your_token>
   ```

3. **Delete Image:**
   ```
   DELETE http://localhost:5000/api/stalls/images/1
   
   Headers:
   - Authorization: Bearer <your_token>
   ```

### Using cURL

```bash
# Upload images
curl -X POST http://localhost:5000/api/stalls/123/images/upload \
  -H "Authorization: Bearer <token>" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "stall_id=123" \
  -F "branch_id=1" \
  -F "stall_number=25" \
  -F "is_primary=true"

# Get images
curl -X GET http://localhost:5000/api/stalls/123/images \
  -H "Authorization: Bearer <token>"

# Delete image
curl -X DELETE http://localhost:5000/api/stalls/images/1 \
  -H "Authorization: Bearer <token>"
```

---

## ⚠️ Important Notes

### XAMPP Configuration

Ensure XAMPP's `htdocs` folder is accessible:

1. **Check Directory Permissions:**
   ```bash
   # The upload folder must exist and be writable
   C:/xampp/htdocs/digistall_uploads/stalls/
   ```

2. **Apache Configuration:**
   - Ensure Apache is running
   - Verify `http://localhost/` is accessible

3. **Create Base Directory (if needed):**
   ```bash
   mkdir C:/xampp/htdocs/digistall_uploads
   mkdir C:/xampp/htdocs/digistall_uploads/stalls
   ```

### File Upload Limits

If you encounter upload size errors, update PHP settings:

**File:** `C:/xampp/php/php.ini`

```ini
upload_max_filesize = 10M
post_max_size = 10M
max_file_uploads = 20
```

**Restart Apache after changes.**

---

## 🚀 Deployment Checklist

- [ ] Run database migration
- [ ] Verify `stall_images` table exists
- [ ] Test stored procedures
- [ ] Create base upload directory
- [ ] Set proper folder permissions
- [ ] Update PHP upload limits
- [ ] Test API endpoints
- [ ] Integrate Vue component
- [ ] Test file uploads
- [ ] Test image deletion
- [ ] Test primary image setting
- [ ] Verify image URLs are accessible

---

## 🐛 Troubleshooting

### Images Not Uploading

1. **Check folder permissions:**
   ```bash
   # Ensure writable
   icacls "C:\xampp\htdocs\digistall_uploads" /grant Everyone:F
   ```

2. **Check PHP error logs:**
   ```
   C:/xampp/apache/logs/error.log
   ```

3. **Verify multer configuration:**
   - Check `BASE_UPLOAD_DIR` path
   - Ensure branch_id and stall_number are provided

### Images Not Displaying

1. **Verify Apache is serving static files:**
   ```
   http://localhost/digistall_uploads/stalls/1/25/1.jpg
   ```

2. **Check CORS settings** (if frontend is on different port)

3. **Verify image URLs in database match filesystem**

### Database Errors

1. **Check if triggers are working:**
   ```sql
   SHOW TRIGGERS LIKE 'stall_images';
   ```

2. **Verify foreign key constraints:**
   ```sql
   SELECT * FROM stalls WHERE stall_id = 123;
   ```

---

## 📚 Additional Resources

- [Multer Documentation](https://github.com/expressjs/multer)
- [Vuetify File Input](https://vuetifyjs.com/en/components/file-inputs/)
- [MySQL Triggers](https://dev.mysql.com/doc/refman/8.0/en/triggers.html)
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

---

## ✅ Summary

You now have a complete multi-image upload system with:

✅ Database table and stored procedures  
✅ Backend API endpoints  
✅ Multer configuration with validation  
✅ Vue.js component for image management  
✅ Automatic folder creation  
✅ Image limit enforcement (10 max)  
✅ Primary image designation  
✅ Complete CRUD operations  

**Next Steps:**
1. Run the database migration
2. Test the API endpoints
3. Integrate the Vue component
4. Deploy and test in production
