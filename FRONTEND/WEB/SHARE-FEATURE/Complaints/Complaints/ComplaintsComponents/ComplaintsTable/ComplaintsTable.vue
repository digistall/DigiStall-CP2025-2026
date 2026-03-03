<!-- ComplaintsTable.vue (component) -->
<template>
  <div class="complaints-table-container">
    <div class="complaints-table-wrapper scrollable-table-wrapper">
      <table class="complaints-table">
        <thead>
          <tr>
            <th>Complaint ID</th>
            <th>Date</th>
            <th>Type</th>
            <th>Sender</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <!-- ✅ Use paginatedComplaints instead of filteredComplaints -->
          <tr
            v-for="complaints in paginatedComplaints"
            :key="complaints.id"
            @click="viewComplaints(complaints)"
            class="complaints-row-clickable"
            :title="'Click to view details'"
          >
            <td>{{ complaints.id }}</td>
            <td>{{ complaints.date }}</td>
            <td>{{ complaints.type }}</td>
            <td>{{ complaints.sender }}</td>
            <td>
              <span
                class="complaints-status-badge"
                :class="getStatusClass(complaints.status)"
              >
                {{ complaints.status.toUpperCase() }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredComplaints.length === 0" class="complaints-empty-state">
        <svg class="complaints-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <h3>No complaints records found</h3>
        <p>{{ searchQuery ? 'Try adjusting your search criteria' : 'No complaints records available yet' }}</p>
      </div>
    </div>

    <!-- Pagination -->
    <div class="complaints-pagination-wrapper" v-if="totalPages > 1">
      <button
        class="complaints-page-btn"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        ← Previous
      </button>

      <span class="complaints-page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>

      <button
        class="complaints-page-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        Next →
      </button>
    </div>
  </div>
</template>

<script>
import script from './ComplaintsTable.js'
import './ComplaintsTable.css'
export default script
</script>
