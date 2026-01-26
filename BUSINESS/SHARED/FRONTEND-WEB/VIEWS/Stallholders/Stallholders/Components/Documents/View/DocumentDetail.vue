<template>
  <div class="document-detail-overlay" v-if="isVisible" @click="closeModal">
    <div class="document-detail-modal" @click.stop>
      <div class="modal-header">
        <h2>{{ document.name }}</h2>
        <button class="close-btn" @click="closeModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="document-content">
        <div class="document-preview">
          <!-- Image Preview -->
          <div class="preview-container" v-if="document.type === 'image' && document.id">
            <img 
              :src="getDocumentUrl(document.id)"
              :alt="document.name" 
              class="document-image"
              @error="handleImageError"
            />
          </div>
          
          <!-- PDF Preview -->
          <div class="preview-container" v-else-if="document.type === 'pdf' && document.id">
            <iframe 
              :src="getDocumentUrl(document.id)"
              class="document-iframe"
              width="100%" 
              height="600px"
              @error="handlePdfError"
            >
            </iframe>
          </div>
          
          <!-- Fallback/Placeholder -->
          <div class="preview-placeholder" v-else>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
            </svg>
            <p>Document Preview</p>
            <p class="text-muted">{{ document.type ? document.type.toUpperCase() : 'Unknown' }} file</p>
          </div>
        </div>
        
        <div class="document-info-panel">
          <div class="info-section">
            <h3>Document Information</h3>
            <div class="info-row">
              <span class="label">Document Type:</span>
              <span class="value">{{ document.name }}</span>
            </div>
            <div class="info-row">
              <span class="label">Upload Date:</span>
              <span class="value">{{ formatDate(document.uploadDate) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="status-badge" :class="getStatusClass(document.status)">
                {{ document.status.toUpperCase() }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">File Type:</span>
              <span class="value">{{ document.type.toUpperCase() }}</span>
            </div>
          </div>
          
          <div class="action-section" v-if="document.status !== 'approved' && document.status !== 'rejected'">
            <h3>Review Actions</h3>
            <div class="action-buttons">
              <button class="accept-btn" @click="acceptDocument">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                ACCEPT
              </button>
              <button class="decline-btn" @click="declineDocument">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                DECLINE
              </button>
            </div>
          </div>
          
          <div class="status-section" v-else>
            <h3>Review Status</h3>
            <div class="status-message" :class="document.status">
              <svg v-if="document.status === 'approved'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Document {{ document.status === 'approved' ? 'Approved' : 'Rejected' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./DocumentDetail.js"></script>
<style scoped src="./DocumentDetail.css"></style>