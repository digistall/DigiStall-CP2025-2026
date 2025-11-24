<!-- ComplianceTable.vue (component) -->
<template>
  <div class="compliance-table-container">
    <div class="compliance-table-wrapper scrollable-table-wrapper">
      <table class="compliance-table">
        <thead>
          <tr>
            <th>Compliance ID</th>
            <th>Date</th>
            <th>Type</th>
            <th>Inspector</th>
            <th>Stallholder</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <!-- ✅ Use paginatedCompliance instead of filteredCompliance -->
          <tr
            v-for="compliance in paginatedCompliance"
            :key="compliance.id"
            @click="viewCompliance(compliance)"
            class="compliance-row-clickable"
            :title="'Click to view details'"
          >
            <td>{{ compliance.id }}</td>
            <td>{{ compliance.date }}</td>
            <td>{{ compliance.type }}</td>
            <td>{{ compliance.inspector }}</td>
            <td class="compliance-name-cell">
              <div class="compliance-name-wrapper">
                <div class="compliance-avatar">
                  {{ getInitials(compliance.stallholder) }}
                </div>
                <span>{{ compliance.stallholder }}</span>
              </div>
            </td>
            <td>
              <span
                class="compliance-status-badge"
                :class="getStatusClass(compliance.status)"
              >
                {{ compliance.status.toUpperCase() }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredCompliance.length === 0" class="compliance-empty-state">
        <svg class="compliance-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <h3>No compliance records found</h3>
        <p>{{ searchQuery ? 'Try adjusting your search criteria' : 'No compliance records available yet' }}</p>
      </div>
    </div>

    <!-- Pagination -->
    <div class="compliance-pagination-wrapper" v-if="totalPages > 1">
      <button
        class="compliance-page-btn"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        ← Previous
      </button>

      <span class="compliance-page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>

      <button
        class="compliance-page-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        Next →
      </button>
    </div>
  </div>
</template>

<script>
import script from './ComplianceTable.js'
import './ComplianceTable.css'
export default script
</script>
