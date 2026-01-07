# 🖼️ Stall Image Management - Visual Flow Diagram

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STALL IMAGE MANAGEMENT                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐          ┌──────────────────┐          ┌──────────────┐
│                 │          │                  │          │              │
│   Vue.js        │   HTTP   │   Express.js     │   SQL    │   MySQL      │
│   Component     │◄────────►│   Backend API    │◄────────►│   Database   │
│                 │          │                  │          │              │
└─────────────────┘          └──────────────────┘          └──────────────┘
        │                             │                             │
        │                             │                             │
        ▼                             ▼                             ▼
  Multi-file                     Multer Config              stall_images
   Upload UI                   File Validation                  Table
  Image Gallery               Folder Creation             Stored Procedures
  CRUD Operations             Image Storage                   Triggers
```

---

## 🔄 Upload Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                          IMAGE UPLOAD PROCESS                         │
└──────────────────────────────────────────────────────────────────────┘

1. USER ACTION
   ┌─────────────────────────────────────────────────────────────────┐
   │ User selects images in StallImageManager component              │
   │ - Multiple files (max 10)                                       │
   │ - Max 2MB each                                                  │
   │ - PNG/JPG only                                                  │
   └─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
2. FRONTEND VALIDATION
   ┌─────────────────────────────────────────────────────────────────┐
   │ Vue component validates:                                         │
   │ ✓ File count (current + new ≤ 10)                              │
   │ ✓ File size (≤ 2MB each)                                       │
   │ ✓ File type (PNG/JPG)                                          │
   └─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
3. FORMDATA PREPARATION
   ┌─────────────────────────────────────────────────────────────────┐
   │ Create FormData with:                                            │
   │ - images: [File, File, ...]                                     │
   │ - stall_id: 123                                                 │
   │ - branch_id: 1                                                  │
   │ - stall_number: 25                                              │
   │ - is_primary: true                                              │
   └─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
4. API REQUEST
   ┌─────────────────────────────────────────────────────────────────┐
   │ POST /api/stalls/:stall_id/images/upload                        │
   │ Headers:                                                         │
   │ - Authorization: Bearer <token>                                 │
   │ - Content-Type: multipart/form-data                             │
   └─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
5. BACKEND PROCESSING
   ┌─────────────────────────────────────────────────────────────────┐
   │ a) Multer middleware intercepts request                         │
   │    ├─ Validates file type                                       │
   │    ├─ Validates file size                                       │
   │    └─ Checks file count                                         │
   │                                                                  │
   │ b) Dynamic folder creation                                      │
   │    ├─ Check: /stalls/{branch_id}/{stall_number}/                │
   │    └─ Create if not exists (recursive)                          │
   │                                                                  │
   │ c) File naming                                                  │
   │    ├─ Count existing files                                      │
   │    ├─ Find next available number                                │
   │    └─ Save as: 1.jpg, 2.jpg, 3.jpg, etc.                       │
   └─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
6. DATABASE OPERATIONS
   ┌─────────────────────────────────────────────────────────────────┐
   │ For each uploaded file:                                          │
   │                                                                  │
   │ CALL sp_addStallImage(                                          │
   │     stall_id,                                                   │
   │     image_url,                                                  │
   │     is_primary                                                  │
   │ )                                                               │
   │                                                                  │
   │ Stored Procedure:                                               │
   │ ├─ Validates stall exists                                       │
   │ ├─ Checks image count < 10                                      │
   │ ├─ Inserts record                                               │
   │ └─ Returns inserted image data                                  │
   │                                                                  │
   │ Trigger (before_stall_image_insert):                            │
   │ ├─ Enforces 10 image limit                                      │
   │ ├─ Auto-sets display_order                                      │
   │ └─ Ensures only one primary image                               │
   └─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
7. RESPONSE
   ┌─────────────────────────────────────────────────────────────────┐
   │ {                                                                │
   │   "success": true,                                               │
   │   "message": "Successfully uploaded 3 image(s)",                 │
   │   "data": {                                                      │
   │     "images": [                                                  │
   │       {                                                          │
   │         "id": 1,                                                 │
   │         "image_url": "http://localhost/.../1.jpg",              │
   │         "is_primary": 1,                                         │
   │         "display_order": 1                                       │
   │       }                                                          │
   │     ],                                                           │
   │     "total_images": 3                                            │
   │   }                                                              │
   │ }                                                                │
   └─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
8. UI UPDATE
   ┌─────────────────────────────────────────────────────────────────┐
   │ - Show success message                                           │
   │ - Reload image gallery                                          │
   │ - Update image count (X/10)                                     │
   │ - Clear file input                                              │
   └─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ File Storage Structure

```
C:/xampp/htdocs/
└── digistall_uploads/
    └── stalls/
        ├── 1/                          ← Branch ID
        │   ├── 25/                     ← Stall Number
        │   │   ├── 1.jpg              ← Image 1 (Primary)
        │   │   ├── 2.jpg              ← Image 2
        │   │   └── 3.jpg              ← Image 3
        │   ├── 26/
        │   │   ├── 1.jpg
        │   │   └── 2.jpg
        │   └── 27/
        │       └── 1.jpg
        └── 2/
            ├── 10/
            │   ├── 1.jpg
            │   ├── 2.jpg
            │   └── 3.jpg
            └── 15/
                └── 1.jpg

Image URL Format:
http://localhost/digistall_uploads/stalls/{branch_id}/{stall_number}/{filename}

Example:
http://localhost/digistall_uploads/stalls/1/25/1.jpg
```

---

## 🗄️ Database Schema

```sql
┌─────────────────────────────────────────────────────────────────┐
│                        stall_images TABLE                        │
├──────────────────┬──────────────────┬──────────────────────────┤
│ Field            │ Type             │ Notes                     │
├──────────────────┼──────────────────┼──────────────────────────┤
│ id               │ INT              │ Primary Key, Auto Inc    │
│ stall_id         │ INT              │ FK → stalls(stall_id)    │
│ image_url        │ VARCHAR(255)     │ Full URL to image        │
│ display_order    │ TINYINT          │ Order: 1-10              │
│ is_primary       │ TINYINT(1)       │ 0 or 1 (only one = 1)    │
│ created_at       │ TIMESTAMP        │ Auto generated           │
│ updated_at       │ TIMESTAMP        │ Auto updated             │
└──────────────────┴──────────────────┴──────────────────────────┘

Constraints:
├─ UNIQUE: None (multiple images per stall)
├─ FOREIGN KEY: stall_id → stalls(stall_id) ON DELETE CASCADE
├─ INDEX: idx_stall_id (stall_id)
└─ INDEX: idx_display_order (display_order)

Triggers:
├─ before_stall_image_insert
│  ├─ Enforces max 10 images per stall
│  ├─ Auto-sets display_order
│  └─ Ensures only one is_primary = 1
└─ before_stall_image_update
   └─ Maintains single primary image

Stored Procedures:
├─ sp_getStallImages(stall_id)         → SELECT all images
├─ sp_addStallImage(...)                → INSERT with validation
├─ sp_deleteStallImage(image_id)        → DELETE with cleanup
└─ sp_setStallPrimaryImage(image_id)    → UPDATE primary flag
```

---

## 🔐 Security Flow

```
┌────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYERS                           │
└────────────────────────────────────────────────────────────────┘

LAYER 1: Frontend Validation
├─ File type check (client-side)
├─ File size check (client-side)
├─ Image count validation
└─ User feedback before upload

LAYER 2: API Authentication
├─ JWT token required
├─ Role-based permissions (viewOnlyForOwners)
└─ Request validation

LAYER 3: Multer Middleware
├─ File type filter (PNG/JPG only)
├─ File size limit (2MB)
├─ File count limit (10 max)
└─ Filename sanitization

LAYER 4: Controller Validation
├─ Verify stall exists
├─ Check user permissions
├─ Validate branch_id and stall_number
└─ Count existing images

LAYER 5: Database Constraints
├─ Foreign key validation
├─ Trigger enforcement (max 10)
├─ SQL injection prevention (prepared statements)
└─ Transaction rollback on error

LAYER 6: File System
├─ Sandboxed upload directory
├─ No executable files
├─ Read-only public access
└─ Path traversal protection
```

---

## 📱 Component Hierarchy

```
EditStall.vue (Parent)
│
├─ <v-dialog> Modal Container
│   │
│   ├─ <v-tabs> Tab Navigation
│   │   ├─ Tab 1: Stall Details (existing)
│   │   └─ Tab 2: Images (new)
│   │
│   └─ <v-tabs-window>
│       │
│       ├─ Window 1: Form Fields
│       │
│       └─ Window 2: StallImageManager
│           │
│           ├─ Upload Section
│           │   ├─ <v-file-input> File selector
│           │   ├─ <v-btn> Upload button
│           │   └─ <v-alert> Warnings/Errors
│           │
│           └─ Gallery Section
│               ├─ <v-progress-circular> Loading
│               ├─ Empty state
│               └─ <v-row> Image Grid
│                   └─ <v-col> × N images
│                       └─ <v-card> Image Card
│                           ├─ <v-img> Image display
│                           ├─ <v-chip> Primary badge
│                           └─ <v-card-actions>
│                               ├─ Set Primary button
│                               └─ Delete button
│
└─ <v-dialog> Delete Confirmation
```

---

## 🔄 State Management Flow

```
┌────────────────────────────────────────────────────────────────┐
│                   VUE COMPONENT STATE                           │
└────────────────────────────────────────────────────────────────┘

Data Properties:
├─ images: []                 ← List of uploaded images
├─ selectedFiles: []          ← Files selected for upload
├─ isLoading: false          ← Loading state
├─ isUploading: false        ← Upload in progress
├─ isDeleting: false         ← Delete in progress
├─ isUpdating: false         ← Update in progress
├─ showDeleteDialog: false   ← Delete confirmation visible
└─ imageToDelete: null       ← Image marked for deletion

Computed Properties:
└─ sortedImages              ← Images sorted by primary + order

Methods:
├─ loadImages()              → Fetch all images from API
├─ handleFileSelection()     → Validate selected files
├─ uploadImages()            → Upload to API
├─ confirmDelete()           → Show delete confirmation
├─ deleteImage()             → Delete via API
└─ setPrimary()              → Set primary via API

Lifecycle:
mounted() → loadImages()     ← Initial data load

Events Emitted:
├─ @success(message)         → Success notification
└─ @error(message)           → Error notification

Props Received:
├─ :stall-id                 ← Stall identifier
├─ :branch-id                ← Branch identifier
├─ :stall-number             ← Stall number
└─ :readonly                 ← Read-only mode flag
```

---

## 🧪 Testing Workflow

```
┌────────────────────────────────────────────────────────────────┐
│                      TESTING PROCESS                            │
└────────────────────────────────────────────────────────────────┘

1. SETUP PHASE
   ├─ Run: .\Setup-StallImages.ps1
   ├─ Execute: create_stall_images_table.sql
   ├─ Verify: Directories created
   └─ Check: Apache running

2. DATABASE TESTING
   ├─ Verify table creation
   ├─ Test stored procedures
   ├─ Test triggers
   └─ Check constraints

3. API TESTING (Postman)
   ├─ Import collection
   ├─ Set variables (base_url, jwt_token)
   ├─ Test login endpoint
   ├─ Test upload endpoint
   ├─ Test get images endpoint
   ├─ Test delete endpoint
   └─ Test set primary endpoint

4. INTEGRATION TESTING
   ├─ Upload single image
   ├─ Upload multiple images
   ├─ Upload 10 images (max)
   ├─ Try upload 11th image (should fail)
   ├─ Set primary image
   ├─ Delete image
   └─ Verify filesystem cleanup

5. FRONTEND TESTING
   ├─ Component renders correctly
   ├─ File selection works
   ├─ Upload progress displays
   ├─ Gallery displays images
   ├─ Primary badge shows correctly
   ├─ Delete confirmation works
   └─ Error messages display

6. EDGE CASE TESTING
   ├─ Upload oversized file (>2MB)
   ├─ Upload wrong file type
   ├─ Upload when at limit (10 images)
   ├─ Delete primary image
   ├─ Delete non-existent image
   └─ Access without authentication
```

---

## 📈 Performance Optimization

```
┌────────────────────────────────────────────────────────────────┐
│                   OPTIMIZATION STRATEGIES                       │
└────────────────────────────────────────────────────────────────┘

DATABASE LEVEL
├─ Indexes on stall_id and display_order
├─ Prepared statements (SQL injection prevention)
├─ Connection pooling
└─ Cascade delete for automatic cleanup

FILE STORAGE
├─ Organized directory structure
├─ Sequential naming for fast lookup
├─ No unnecessary metadata
└─ Direct file serving via Apache

API LEVEL
├─ Minimal database queries
├─ Efficient file handling (streams)
├─ Proper error handling
└─ Response compression

FRONTEND LEVEL
├─ Lazy loading images
├─ Thumbnail optimization ready
├─ Progressive upload feedback
├─ Debounced operations
└─ Component-level caching

FUTURE ENHANCEMENTS
├─ CDN integration
├─ Image compression
├─ WebP format support
├─ Thumbnail generation
└─ Lazy loading implementation
```

---

## 🎯 Implementation Checklist Visualization

```
PRE-DEPLOYMENT CHECKLIST
═══════════════════════════════════════════════════

DATABASE
├─ [✓] Create stall_images table
├─ [✓] Create stored procedures
├─ [✓] Create triggers
└─ [✓] Test constraints

BACKEND
├─ [✓] Multer configuration
├─ [✓] Image controller
├─ [✓] API routes
└─ [✓] Error handling

FRONTEND
├─ [✓] StallImageManager component
├─ [✓] Integration with EditStall
├─ [✓] Event handlers
└─ [✓] Error display

INFRASTRUCTURE
├─ [ ] Create upload directories
├─ [ ] Set permissions
├─ [ ] Configure PHP settings
└─ [ ] Restart Apache

TESTING
├─ [ ] Test API endpoints
├─ [ ] Test file uploads
├─ [ ] Test image deletion
└─ [ ] Test frontend UI

DOCUMENTATION
├─ [✓] Implementation guide
├─ [✓] API documentation
├─ [✓] Setup scripts
└─ [✓] Testing utilities

DEPLOYMENT
├─ [ ] Run setup script
├─ [ ] Execute migration
├─ [ ] Verify functionality
└─ [ ] Monitor errors

Legend:
[✓] = Complete
[ ] = Pending
```

---

**Generated:** December 7, 2025  
**System:** DigiStall - Stall Image Management  
**Version:** 1.0.0
