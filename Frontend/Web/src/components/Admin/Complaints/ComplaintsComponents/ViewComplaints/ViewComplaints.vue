<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <!-- HEADER -->
      <div class="modal-header">
        <h3 class="modal-title">Complaints Details</h3>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <!-- BODY -->
      <div class="modal-body" v-if="complaints">
        <!-- Top Info Grid -->
        <div class="info-grid">
          <div class="info-card">
            <strong>Complaint ID</strong>
            <p>{{ complaints.id }}</p>
          </div>
          <div class="info-card">
            <strong>Date Submitted</strong>
            <p>{{ complaints.date }}</p>
          </div>
          <div class="info-card">
            <strong>Complaint Type</strong>
            <p>{{ complaints.type }}</p>
          </div>
          <div class="info-card">
            <strong>Priority</strong>
            <p>
              <span :class="getPriorityClass(complaints.priority || 'medium')">
                {{ (complaints.priority || 'medium').toUpperCase() }}
              </span>
            </p>
          </div>
          <div class="info-card">
            <strong>Status</strong>
            <p>
              <span :class="getStatusClass(complaints.status)">
                {{ complaints.status.toUpperCase() }}
              </span>
            </p>
          </div>
        </div>

        <!-- Sender Section with Icon -->
        <div class="person-section sender-section">
          <div class="person-header">
            <svg class="person-icon sender-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span class="person-label">COMPLAINT SENDER</span>
          </div>
          <div class="person-card">
            <div class="avatar sender-avatar">
              {{ complaints.sender ? complaints.sender.split(' ').map(n => n[0]).join('').substring(0, 2) : "S" }}
            </div>
            <div class="person-details">
              <span class="person-name">{{ complaints.sender }}</span>
              <div class="contact-info">
                <div v-if="complaints.sender_contact" class="contact-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>{{ complaints.sender_contact }}</span>
                </div>
                <div v-if="complaints.sender_email" class="contact-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>{{ complaints.sender_email }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stallholder Section with Icon -->
        <div class="person-section stallholder-section">
          <div class="person-header">
            <svg class="person-icon stallholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span class="person-label">COMPLAINED STALLHOLDER</span>
          </div>
          <div class="person-card">
            <div class="avatar stallholder-avatar">
              {{ complaints.stallholder ? complaints.stallholder.split(' ').map(n => n[0]).join('').substring(0, 2) : "N/A" }}
            </div>
            <div class="person-details">
              <span class="person-name">{{ complaints.stallholder || 'Not Specified' }}</span>
              <div class="contact-info">
                <div v-if="complaints.stall_no" class="contact-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                  </svg>
                  <span>Stall #{{ complaints.stall_no }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Subject -->
        <div class="info-section">
          <strong class="section-title">Subject</strong>
          <p class="section-content">{{ complaints.subject || 'No subject provided' }}</p>
        </div>

        <!-- Description -->
        <div class="info-section">
          <strong class="section-title">Description</strong>
          <p class="section-content">{{ complaints.description || 'No description provided' }}</p>
        </div>

        <!-- Evidence/Attachments -->
        <div class="info-section">
          <strong class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
            Evidence / Attachments
          </strong>
          <div class="evidence-container">
            <div v-if="!complaints.evidence" class="evidence-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p>No evidence attached</p>
            </div>
            <div v-else class="evidence-placeholder">
              <p>Evidence files will be displayed here</p>
            </div>
          </div>
        </div>

        <!-- Resolution Notes (if resolved or rejected) -->
        <div v-if="complaints.resolution_notes" class="info-section resolution-section">
          <strong class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            Resolution Notes
          </strong>
          <p class="section-content">{{ complaints.resolution_notes }}</p>
          <div v-if="complaints.date_resolved" class="resolution-date">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Resolved on: {{ formatDate(complaints.date_resolved) }}</span>
          </div>
        </div>
      </div>

      <!-- No Data -->
      <div class="modal-body" v-else>
        <p>No complaints data available.</p>
      </div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <button class="modal-button secondary" @click="closeModal">Close</button>
        <button 
          v-if="complaints && !isResolved && !isRejected" 
          class="modal-button resolve" 
          @click="openResolveModal"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4"></path>
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
          Resolve Complaint
        </button>
        <button class="modal-button primary" @click="editComplaints">Edit Complaints</button>
      </div>
    </div>

    <!-- Resolve Modal -->
    <div v-if="showResolveModal" class="resolve-modal-overlay" @click.self="closeResolveModal">
      <div class="resolve-modal-content">
        <div class="resolve-modal-header">
          <h3 class="resolve-modal-title">Resolve Complaint</h3>
          <button class="close-button" @click="closeResolveModal">&times;</button>
        </div>
        
        <div class="resolve-modal-body">
          <div class="resolve-info">
            <p><strong>Complaint ID:</strong> {{ complaints?.id }}</p>
            <p><strong>Type:</strong> {{ complaints?.type }}</p>
            <p><strong>Subject:</strong> {{ complaints?.subject }}</p>
          </div>

          <div class="form-group">
            <label for="resolution-status">Resolution Status</label>
            <select id="resolution-status" v-model="resolveData.status" class="form-select">
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div class="form-group">
            <label for="resolution-notes">Resolution Notes <span class="required">*</span></label>
            <textarea 
              id="resolution-notes"
              v-model="resolveData.resolution_notes"
              class="form-textarea"
              rows="5"
              placeholder="Enter detailed notes about the resolution or action taken..."
              :class="{ 'error': resolveError }"
            ></textarea>
            <span v-if="resolveError" class="error-message">{{ resolveError }}</span>
          </div>
        </div>

        <div class="resolve-modal-footer">
          <button class="modal-button secondary" @click="closeResolveModal" :disabled="isResolving">
            Cancel
          </button>
          <button 
            class="modal-button resolve" 
            @click="submitResolve"
            :disabled="isResolving"
          >
            <span v-if="isResolving" class="loading-spinner"></span>
            <span v-else>{{ resolveData.status === 'resolved' ? 'Mark as Resolved' : 'Mark as Rejected' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./ViewComplaints.js"></script>
<style scoped src="./ViewComplaints.css"></style>
