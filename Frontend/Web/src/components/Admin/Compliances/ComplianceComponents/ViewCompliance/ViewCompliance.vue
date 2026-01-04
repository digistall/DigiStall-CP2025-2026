<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <!-- HEADER -->
      <div class="modal-header">
        <div class="header-info">
          <h3 class="modal-title">Compliance Details</h3>
          <span class="compliance-id-badge">{{ compliance?.id || 'N/A' }}</span>
        </div>
        <button class="close-button" @click="closeModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- BODY with Scroll -->
      <div class="modal-body-scroll" v-if="compliance">
        <!-- Status Bar -->
        <div class="status-bar">
          <span :class="['status-pill', getStatusClass(compliance.status || 'pending')]">
            {{ (compliance.status || 'PENDING').toUpperCase() }}
          </span>
          <span :class="['severity-pill', getSeverityClass(compliance.severity)]">
            {{ (compliance.severity || 'moderate').toUpperCase() }}
          </span>
          <span class="date-pill">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            {{ compliance.date || 'N/A' }}
          </span>
        </div>

        <!-- Quick Info Row -->
        <div class="quick-info-row">
          <div class="quick-info-item">
            <span class="qi-label">Receipt #</span>
            <span class="qi-value">{{ compliance.receipt_number || 'N/A' }}</span>
          </div>
          <div class="quick-info-item">
            <span class="qi-label">Offense</span>
            <span class="qi-value">#{{ compliance.offense_no || 1 }}</span>
          </div>
          <div class="quick-info-item">
            <span class="qi-label">Penalty</span>
            <span class="qi-value penalty">₱{{ Number(compliance.penalty_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>

        <!-- Violation Card -->
        <div class="detail-card">
          <div class="card-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Violation
          </div>
          <p class="card-value">{{ compliance.type || 'N/A' }}</p>
          <div class="violation-extra" v-if="compliance.ordinance_no || compliance.violation_details">
            <span v-if="compliance.ordinance_no" class="ordinance-badge">Ordinance: {{ compliance.ordinance_no }}</span>
            <p v-if="compliance.violation_details" class="violation-desc">{{ compliance.violation_details }}</p>
          </div>
        </div>

        <!-- Location Card -->
        <div class="detail-card">
          <div class="card-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Location
          </div>
          <div class="location-info">
            <span><strong>Branch:</strong> {{ compliance.branch_name || 'N/A' }}</span>
            <span><strong>Stall:</strong> {{ compliance.stall_no || 'N/A' }}</span>
          </div>
        </div>

        <!-- People Section -->
        <div class="people-row">
          <div class="person-card inspector">
            <div class="person-avatar">{{ compliance.inspector ? compliance.inspector[0] : '?' }}</div>
            <div class="person-info">
              <span class="person-name">{{ compliance.inspector || 'Unassigned' }}</span>
              <span class="person-role">Inspector</span>
            </div>
          </div>
          <div class="person-card stallholder">
            <div class="person-avatar">{{ compliance.stallholder ? compliance.stallholder[0] : '?' }}</div>
            <div class="person-info">
              <span class="person-name">{{ compliance.stallholder || 'Unassigned' }}</span>
              <span class="person-role">Stallholder</span>
              <span :class="['compliance-badge', compliance.stallholder_compliance_status === 'Compliant' ? 'compliant' : 'non-compliant']">
                {{ compliance.stallholder_compliance_status || 'Compliant' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Stallholder Contact Info -->
        <div class="detail-card contact-card" v-if="compliance.stallholder_contact || compliance.stallholder_email">
          <div class="card-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            Contact Info
          </div>
          <div class="contact-info">
            <span v-if="compliance.stallholder_contact">📞 {{ compliance.stallholder_contact }}</span>
            <span v-if="compliance.stallholder_email">✉️ {{ compliance.stallholder_email }}</span>
          </div>
        </div>

        <!-- Notes Section -->
        <div class="detail-card" v-if="compliance.notes">
          <div class="card-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            Notes / Remarks
          </div>
          <p class="card-value notes-text">{{ compliance.notes }}</p>
        </div>

        <!-- Penalty Info -->
        <div class="detail-card penalty-card" v-if="compliance.penalty_remarks">
          <div class="card-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            Penalty Info
          </div>
          <p class="card-value">{{ compliance.penalty_remarks }}</p>
        </div>

        <!-- Evidence Section -->
        <div class="detail-card" v-if="compliance.evidence">
          <div class="card-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            Evidence
          </div>
          <p class="card-value">{{ compliance.evidence }}</p>
        </div>

        <!-- Payment Section (if paid) -->
        <div class="detail-card payment-card" v-if="compliance.payment_date">
          <div class="card-header payment-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            Payment Details
            <span class="paid-badge">✓ PAID</span>
          </div>
          <div class="payment-info">
            <div class="payment-row">
              <span class="payment-label">Reference #:</span>
              <span class="payment-value">{{ compliance.payment_reference || 'N/A' }}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Amount Paid:</span>
              <span class="payment-value amount">₱{{ Number(compliance.paid_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Payment Date:</span>
              <span class="payment-value">{{ compliance.payment_date || 'N/A' }}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Collected By:</span>
              <span class="payment-value">{{ compliance.collected_by || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Resolution Info -->
        <div class="detail-card resolution" v-if="compliance.resolved_date">
          <div class="card-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Resolved
          </div>
          <p class="card-value">{{ compliance.resolved_date }}</p>
        </div>
      </div>

      <!-- No Data -->
      <div class="modal-body-scroll" v-else>
        <p class="no-data">No compliance data available.</p>
      </div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <button class="modal-button secondary" @click="closeModal">Close</button>
        <button class="modal-button primary">Edit</button>
      </div>
    </div>
  </div>
</template>

<script src="./ViewCompliance.js"></script>
<style scoped src="./ViewCompliance.css"></style>
