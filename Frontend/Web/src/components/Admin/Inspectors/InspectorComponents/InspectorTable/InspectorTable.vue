<!-- InspectorTable.vue (component) -->
<template>
  <div class="inspector-table-container">
    <div class="inspector-table-wrapper">
      <table class="inspector-table">
        <thead>
          <tr>
            <th>Inspector ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Contact Number</th>
            <th>Date Hired</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="inspector in paginatedInspectors"
            :key="inspector.id"
            @click="viewInspector(inspector)"
            class="inspector-row-clickable"
            :title="'Click to view details'"
          >
            <td>{{ inspector.id }}</td>
            <td class="inspector-name-cell">
              <div class="inspector-name-wrapper">
                <div class="inspector-avatar">
                  {{ getInitials(inspector.name) }}
                </div>
                <span>{{ inspector.name }}</span>
              </div>
            </td>
            <td>{{ inspector.email }}</td>
            <td>{{ inspector.contact_no }}</td>
            <td>{{ inspector.date_hired }}</td>
            <td>
              <span
                class="inspector-status-badge"
                :class="getStatusClass(inspector.status)"
              >
                {{ inspector.status.toUpperCase() }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredInspectors.length === 0" class="inspector-empty-state">
        <svg class="inspector-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <h3>No inspectors found</h3>
        <p>{{ searchQuery ? 'Try adjusting your search criteria' : 'No inspectors available yet' }}</p>
      </div>
    </div>

    <!-- Pagination -->
    <div class="inspector-pagination-wrapper" v-if="totalPages > 1">
      <button
        class="inspector-page-btn"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        ← Previous
      </button>

      <span class="inspector-page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>

      <button
        class="inspector-page-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        Next →
      </button>
    </div>
  </div>
</template>

<script>
import script from './InspectorTable.js'
import './InspectorTable.css'
export default script
</script>
