# Step 3: Document Display Implementation Guide

## ✅ What Was Implemented

### Files Modified:
1. **DocumentDetail.js** - Added `getDocumentUrl()` method and error handlers
2. **DocumentDetail.vue** - Updated template to use dynamic document URLs

## 🎯 How It Works

### The `getDocumentUrl()` Method

Located in: `Frontend/Web/src/components/Admin/Stallholders/Components/Documents/View/DocumentDetail.js`

```javascript
getDocumentUrl(documentId) {
  if (!documentId) return null;
  // This endpoint serves the document directly from the database
  const baseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3001';
  return `${baseUrl}/api/documents/blob/${documentId}`;
}
```

**Purpose**: Generates the correct URL to fetch document files (images/PDFs) from your backend.

**Parameters**: 
- `documentId` - The ID of the document in the database

**Returns**: 
- Full URL to the document blob endpoint (e.g., `http://localhost:3001/api/documents/blob/123`)

---

## 📄 Template Usage

### For Images:
```vue
<img 
  :src="getDocumentUrl(document.id)"
  :alt="document.name" 
  class="document-image"
  @error="handleImageError"
/>
```

### For PDFs:
```vue
<iframe 
  :src="getDocumentUrl(document.id)"
  class="document-iframe"
  width="100%" 
  height="600px"
  @error="handlePdfError"
>
</iframe>
```

### The Vue Template Logic:

The template now checks `document.type` to determine how to display the file:

```vue
<!-- Image Preview -->
<div v-if="document.type === 'image' && document.id">
  <img :src="getDocumentUrl(document.id)" />
</div>

<!-- PDF Preview -->
<div v-else-if="document.type === 'pdf' && document.id">
  <iframe :src="getDocumentUrl(document.id)"></iframe>
</div>

<!-- Fallback if no document or unknown type -->
<div v-else>
  <p>Document Preview Not Available</p>
</div>
```

---

## 🔧 Error Handling

### Image Load Error:
```javascript
handleImageError(event) {
  console.error('Failed to load document image:', this.document.id);
  event.target.style.display = 'none'; // Hide broken image
}
```

### PDF Load Error:
```javascript
handlePdfError(event) {
  console.error('Failed to load document PDF:', this.document.id);
  // Could show an error message or fallback UI
}
```

---

## 🌐 API Endpoint

**Endpoint**: `GET /api/documents/blob/:documentId`

**Location**: Backend route defined in `Backend-Web/routes/documentRoutes.js`

**Authentication**: This endpoint is **public** (no auth required) to allow direct loading in `<img>` and `<iframe>` tags.

**Response**: Binary document data (JPEG, PNG, PDF, etc.)

**Database**: Fetches `document_data` BLOB from `stallholder_documents` table

---

## 📊 Expected Document Object Structure

The `document` object passed to DocumentDetail should have:

```javascript
{
  id: 123,                    // document_id from database
  name: "Award Paper",        // document name
  type: "image" or "pdf",     // file type
  status: "pending",          // approval status
  uploadDate: "2026-01-19",   // when uploaded
  // ... other fields
}
```

---

## 🧪 Testing

1. **Start your backend server**:
   ```powershell
   cd Backend
   npm start
   ```

2. **Start your frontend**:
   ```powershell
   cd Frontend/Web
   npm run serve
   ```

3. **Test the document display**:
   - Navigate to Stallholders page
   - Click on a stallholder
   - Click "View Documents"
   - Click on a document to open the detail modal
   - The document should load automatically

4. **Check the browser console**:
   - Open DevTools (F12)
   - Look for the network request: `GET /api/documents/blob/123`
   - Status should be `200 OK`
   - Response should show binary data

5. **Verify the image/PDF displays correctly**

---

## 🐛 Troubleshooting

### Issue: Image doesn't load
**Check**:
- Is the document ID correct? (`console.log(document.id)`)
- Is the backend running?
- Check network tab for 404 or 500 errors
- Verify `document.type === 'image'` is true

### Issue: "Failed to load document image" error
**Possible causes**:
- Document doesn't exist in database
- Document has no `document_data` BLOB
- CORS issue (less likely since backend and frontend should be on same domain)
- Wrong document ID

### Issue: PDF iframe is blank
**Check**:
- Browser might block iframe loading
- PDF might be corrupted
- Try downloading the PDF directly: `/api/documents/blob/123`

---

## 🎨 Customization

### Change the base URL:
Set in your `.env` file:
```
VUE_APP_API_BASE_URL=https://your-production-api.com
```

### Add loading spinner:
```vue
<div v-if="document.type === 'image' && document.id">
  <img 
    :src="getDocumentUrl(document.id)"
    @load="imageLoaded = true"
    @error="handleImageError"
    v-show="imageLoaded"
  />
  <v-progress-circular v-show="!imageLoaded" indeterminate />
</div>
```

### Add download button:
```vue
<v-btn 
  :href="getDocumentUrl(document.id)" 
  download
  color="primary"
>
  <v-icon>mdi-download</v-icon>
  Download
</v-btn>
```

---

## ✅ Summary

You now have:
1. ✅ `getDocumentUrl(documentId)` method to generate document URLs
2. ✅ Dynamic image loading from database
3. ✅ Dynamic PDF preview in iframe
4. ✅ Error handling for failed loads
5. ✅ Fallback UI for unsupported file types

The documents are now loaded directly from your MySQL database via the blob endpoint!

---

## 📝 Next Steps

- Implement Step 1 & 2 to actually fetch document data from API
- Add authentication headers if needed for other endpoints
- Style the document preview area
- Add zoom controls for images
- Add pagination for multiple documents

