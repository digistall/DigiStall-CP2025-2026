<template>
  <div class="onsite-payments">
    <!-- Search & Filter Section -->
    <div class="search-filter-section mb-6">
      <v-row align="center">
        <!-- Search Bar -->
        <v-col cols="12" md="6" lg="4">
          <v-text-field
            v-model="searchQuery"
            label="Search Stallholders"
            placeholder="Search by stall number, name, location..."
            variant="outlined"
            clearable
            hide-details
            prepend-inner-icon="mdi-magnify"
            class="search-field"
          ></v-text-field>
        </v-col>

        <!-- Spacer -->
        <v-col cols="12" md="4" lg="6" class="d-none d-md-block"></v-col>

        <!-- Filter Button -->
        <v-col cols="12" md="2" lg="2" class="text-right">
          <div class="filter-container" ref="filterContainer">
            <v-btn
              variant="outlined"
              prepend-icon="mdi-filter-variant"
              @click="toggleFilter"
              class="filter-btn"
              :class="{ 'filter-active': showFilterPanel }"
            >
              Filter
              <v-icon
                :icon="showFilterPanel ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                size="small"
                class="ml-1"
              ></v-icon>
            </v-btn>

            <!-- Filter Dropdown Panel -->
            <transition name="slide-down">
              <div v-show="showFilterPanel" class="filter-dropdown">
                <v-card elevation="8" class="filter-card">
                  <div class="filter-header">
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-filter-variant" size="small" class="mr-2"></v-icon>
                      <span class="filter-title">FILTER OPTIONS</span>
                    </div>
                    <v-btn
                      icon="mdi-close"
                      variant="text"
                      size="small"
                      class="close-btn"
                      @click="showFilterPanel = false"
                    ></v-btn>
                  </div>

                  <div class="filter-content">
                    <!-- Stall Number Sort -->
                    <div class="filter-group">
                      <div class="filter-label">STALL NUMBER</div>
                      <div class="status-buttons">
                        <v-btn
                          v-for="option in stallNumberSortOptions"
                          :key="option.value"
                          :variant="filters.stallNumberSort === option.value ? 'flat' : 'outlined'"
                          :color="filters.stallNumberSort === option.value ? 'primary' : 'default'"
                          class="status-btn"
                          @click="filters.stallNumberSort = filters.stallNumberSort === option.value ? null : option.value"
                        >
                          {{ option.title }}
                        </v-btn>
                      </div>
                    </div>

                    <!-- Section -->
                    <div class="filter-group">
                      <div class="filter-label">SECTION</div>
                      <v-select
                        v-model="filters.section"
                        :items="sectionFilterOptions"
                        placeholder="All Sections"
                        variant="outlined"
                        density="compact"
                        clearable
                        hide-details
                        class="filter-select"
                      ></v-select>
                    </div>

                    <!-- Floor -->
                    <div class="filter-group">
                      <div class="filter-label">FLOOR</div>
                      <v-select
                        v-model="filters.floor"
                        :items="floorFilterOptions"
                        placeholder="All Floors"
                        variant="outlined"
                        density="compact"
                        clearable
                        hide-details
                        class="filter-select"
                      ></v-select>
                    </div>

                    <!-- Status -->
                    <div class="filter-group">
                      <div class="filter-label">STATUS</div>
                      <div class="status-buttons">
                        <v-btn
                          :variant="!filters.status ? 'flat' : 'outlined'"
                          :color="!filters.status ? 'primary' : 'default'"
                          class="status-btn"
                          @click="filters.status = null"
                        >
                          All
                        </v-btn>
                        <v-btn
                          v-for="status in statusFilterOptions"
                          :key="status"
                          :variant="filters.status === status ? 'flat' : 'outlined'"
                          :color="filters.status === status ? 'primary' : 'default'"
                          class="status-btn"
                          @click="filters.status = status"
                        >
                          {{ status }}
                        </v-btn>
                      </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="filter-actions">
                      <v-btn
                        variant="outlined"
                        color="grey"
                        class="action-btn clear-btn"
                        @click="clearFilters"
                      >
                        Clear All
                      </v-btn>
                      <v-btn
                        variant="flat"
                        color="primary"
                        class="action-btn apply-btn"
                        @click="applyFilters"
                      >
                        Apply Filters
                      </v-btn>
                    </div>
                  </div>
                </v-card>
              </div>
            </transition>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Stall Payment Tracker Table -->
    <div class="payments-table-container">
      <v-card class="payments-card" elevation="0">
        <div class="table-wrapper">
          <table class="payments-table">
            <thead>
              <tr>
                <th>Stall Number</th>
                <th>Stallholder Name</th>
                <th>Monthly Rental</th>
                <th>Section</th>
                <th>Floor</th>
                <th>Stall Location</th>
                <th class="center-th">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredStalls.length === 0">
                <td colspan="7" class="empty-state">
                  <v-icon size="48" color="grey">mdi-store-off</v-icon>
                  <p>No stalls with stallholders found</p>
                </td>
              </tr>
              <tr
                v-for="stall in filteredStalls"
                :key="stall.id"
                class="clickable-row"
                @click="viewStallTracker(stall)"
              >
                <td class="stall-cell">
                  <v-chip color="#002181" variant="flat" size="small">
                    {{ stall.stallNo }}
                  </v-chip>
                </td>
                <td class="name-cell">
                  <div class="stallholder-info">
                    <div class="avatar">
                      {{ (stall.name || 'N/A').charAt(0).toUpperCase() }}
                    </div>
                    <span class="name">{{ stall.name || 'N/A' }}</span>
                  </div>
                </td>
                <td class="amount-cell">{{ formatCurrency(stall.monthlyRental) }}</td>
                <td class="section-cell">{{ stall.sectionName || 'N/A' }}</td>
                <td class="floor-cell">{{ stall.floorName || 'N/A' }}</td>
                <td class="location-cell">{{ stall.stallLocation || 'N/A' }}</td>
                <td class="status-cell center-td">
                  <v-chip
                    :color="getStatusConfig(stall).color"
                    variant="flat"
                    size="small"
                  >
                    {{ getStatusConfig(stall).label }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card>
    </div>

    <!-- Add Payment Modal -->
    <v-dialog v-model="showAddModal" max-width="700px" persistent>
      <v-card>
        <v-card-title class="modal-header">
          <span class="modal-title">Add Onsite Payment</span>
          <v-btn icon variant="text" @click="closeAddModal">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="addForm" v-model="formValid">
            <v-row>
              <v-col cols="12">
                <StallholderDropdown
                  v-model="form.stallholderId"
                  :rules="[(v) => !!v || 'Please select a stallholder']"
                  @stallholder-selected="onStallholderSelected"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.stallNo"
                  label="Stall Number"
                  variant="outlined"
                  density="comfortable"
                  readonly
                  prepend-inner-icon="mdi-store"
                  placeholder="Auto-filled when stallholder is selected"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.amount"
                  label="Amount"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  :rules="[
                    (v) => !!v || 'Required',
                    (v) => v > 0 || 'Must be greater than 0',
                  ]"
                  prepend-inner-icon="mdi-currency-php"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.paymentDate"
                  label="Payment Date"
                  variant="outlined"
                  density="comfortable"
                  type="date"
                  :rules="[(v) => !!v || 'Required']"
                  prepend-inner-icon="mdi-calendar"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.paymentTime"
                  label="Payment Time"
                  variant="outlined"
                  density="comfortable"
                  type="time"
                  :rules="[(v) => !!v || 'Required']"
                  prepend-inner-icon="mdi-clock-outline"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.paymentForMonth"
                  label="Payment For Month"
                  variant="outlined"
                  density="comfortable"
                  type="month"
                  prepend-inner-icon="mdi-calendar-month"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.paymentType"
                  :items="['rental', 'utilities', 'maintenance', 'penalty', 'other']"
                  label="Payment Type"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-tag-outline"
                ></v-select>
              </v-col>

              <!-- Violation Dropdown - Only shown when penalty is selected -->
              <v-col cols="12" v-if="isPenaltyPayment">
                <v-select
                  v-model="form.selectedViolation"
                  :items="violationItems"
                  :loading="loadingViolations"
                  :disabled="!form.stallholderId || loadingViolations"
                  label="Select Violation to Pay"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-alert-circle"
                  :rules="[(v) => !!v || 'Please select a violation']"
                  :no-data-text="!form.stallholderId ? 'Select a stallholder first' : 'No unpaid violations found'"
                  return-object
                  item-title="title"
                  item-value="value"
                  @update:modelValue="(item) => form.selectedViolation = item?.value"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-icon :color="getSeverityColor(item.raw.violation?.severity)">
                          mdi-alert-circle
                        </v-icon>
                      </template>
                      <v-list-item-subtitle>
                        <v-chip
                          :color="getSeverityColor(item.raw.violation?.severity)"
                          size="x-small"
                          class="mr-2"
                        >
                          {{ item.raw.violation?.severity }}
                        </v-chip>
                        <span>Offense #{{ item.raw.violation?.offenseNo }} - ₱{{ item.raw.violation?.penaltyAmount?.toLocaleString() }}</span>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>

                <!-- Violation Details Card -->
                <v-card
                  v-if="form.selectedViolation"
                  class="mt-2 violation-details-card"
                  variant="outlined"
                  color="warning"
                >
                  <v-card-text class="pa-3">
                    <div class="d-flex align-center mb-2">
                      <v-icon color="warning" size="20" class="mr-2">mdi-alert</v-icon>
                      <span class="font-weight-bold">Selected Violation Details</span>
                    </div>
                    <div class="violation-info">
                      <div v-for="v in unpaidViolations.filter(x => x.violationId === form.selectedViolation)" :key="v.violationId">
                        <div class="d-flex justify-space-between mb-1">
                          <span class="text-caption">Type:</span>
                          <span class="font-weight-medium">{{ v.violationType }}</span>
                        </div>
                        <div class="d-flex justify-space-between mb-1">
                          <span class="text-caption">Offense #:</span>
                          <span class="font-weight-medium">{{ v.offenseNo }}</span>
                        </div>
                        <div class="d-flex justify-space-between mb-1">
                          <span class="text-caption">Penalty Amount:</span>
                          <span class="font-weight-bold text-error">₱{{ v.penaltyAmount?.toLocaleString() }}</span>
                        </div>
                        <div class="d-flex justify-space-between">
                          <span class="text-caption">Date Reported:</span>
                          <span>{{ formatDate(v.dateReported) }}</span>
                        </div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.collectedBy"
                  label="Collected By"
                  variant="outlined"
                  density="comfortable"
                  :rules="[(v) => !!v || 'Required']"
                  prepend-inner-icon="mdi-account-tie"
                  readonly
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.receiptNo"
                  :label="isPenaltyPayment ? 'Payment Reference Number' : 'Receipt Number'"
                  variant="outlined"
                  density="comfortable"
                  :rules="[(v) => !!v || 'Required']"
                  prepend-inner-icon="mdi-receipt"
                  :placeholder="isPenaltyPayment ? 'Enter payment reference (e.g., REF-001)' : 'Enter receipt number (e.g., RCP-001)'"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.notes"
                  label="Notes (Optional)"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  prepend-inner-icon="mdi-note-text"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeAddModal">Cancel</v-btn>
          <v-btn
            color="#002181"
            variant="flat"
            :disabled="!formValid || (isPenaltyPayment && !form.selectedViolation)"
            @click="addPayment"
          >
            <v-icon class="mr-1">mdi-check</v-icon>
            {{ isPenaltyPayment ? 'Process Violation Payment' : 'Add Payment' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Payment Tracker Modal -->
    <v-dialog v-model="showTrackerModal" max-width="680px" scrollable>
      <v-card v-if="selectedStall" class="tracker-card">
        <v-card-title class="modal-header">
          <span class="modal-title">Payment Details</span>
          <v-btn icon variant="text" @click="showTrackerModal = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0" style="max-height: 75vh; overflow-y: auto;">
          <!-- Stall Summary Info -->
          <div class="stall-info-header">
            <div class="stall-info-row">
              <div class="stall-info-item">
                <span class="info-label">Receipt Number:</span>
                <span class="info-value receipt-value">{{ latestReceiptNo || '—' }}</span>
              </div>
              <div class="stall-info-item">
                <span class="info-label">Payment Date:</span>
                <span class="info-value">{{ latestPaymentDate || '—' }}</span>
              </div>
            </div>
            <div class="stall-info-row">
              <div class="stall-info-item">
                <span class="info-label">Stallholder Name:</span>
                <span class="info-value">{{ selectedStall.name }}</span>
              </div>
              <div class="stall-info-item">
                <span class="info-label">Stall Number:</span>
                <span class="info-value">
                  <v-chip color="#002181" variant="flat" size="x-small">{{ selectedStall.stallNo }}</v-chip>
                </span>
              </div>
            </div>
            <div class="stall-info-row">
              <div class="stall-info-item">
                <span class="info-label">Section:</span>
                <span class="info-value">{{ selectedStall.sectionName || 'N/A' }}</span>
              </div>
              <div class="stall-info-item">
                <span class="info-label">Floor:</span>
                <span class="info-value">{{ selectedStall.floorName || 'N/A' }}</span>
              </div>
            </div>
            <div class="stall-info-row">
              <div class="stall-info-item">
                <span class="info-label">Stall Location:</span>
                <span class="info-value">{{ selectedStall.stallLocation || 'N/A' }}</span>
              </div>
              <div class="stall-info-item">
                <span class="info-label">Monthly Rental:</span>
                <span class="info-value amount">{{ formatCurrency(selectedStall.monthlyRental) }}</span>
              </div>
            </div>
          </div>

          <!-- Monthly Payment Tracker -->
          <div class="tracker-section">
            <div class="tracker-title">
              <v-icon size="18" color="#002181" class="mr-1">mdi-calendar-clock</v-icon>
              Monthly Payment Tracker
            </div>

            <div v-if="trackerLoading" class="tracker-loading">
              <v-progress-circular indeterminate color="#002181" size="28"></v-progress-circular>
              <span>Loading payment history...</span>
            </div>

            <div v-else-if="paymentTracker.length === 0" class="tracker-empty">
              <v-icon size="36" color="grey">mdi-calendar-blank</v-icon>
              <p>No payment history yet</p>
            </div>

            <div v-else class="tracker-list">
              <div
                v-for="(entry, index) in paymentTracker"
                :key="index"
                class="tracker-entry"
                :class="`tracker-${entry.status.toLowerCase()}`"
              >
                <div class="tracker-left">
                  <div class="tracker-icon-wrap">
                    <v-icon size="16" :color="getTrackerStatusConfig(entry.status).iconColor">
                      {{ getTrackerStatusConfig(entry.status).icon }}
                    </v-icon>
                  </div>
                  <div class="tracker-date-block">
                    <span class="tracker-due-label">{{ entry.dueDateFormatted }}</span>
                    <span v-if="entry.receiptNo" class="tracker-receipt-no">{{ entry.receiptNo }}</span>
                  </div>
                </div>
                <div class="tracker-right">
                  <span class="tracker-amount">{{ formatCurrency(entry.amount) }}</span>
                  <v-chip
                    :color="getTrackerStatusConfig(entry.status).color"
                    variant="flat"
                    size="x-small"
                  >
                    {{ entry.status }}
                  </v-chip>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Floating Action Button -->
    <div class="fab-container">
      <button class="fab-button" @click="showAddModal = true">
        <div class="fab-icon">
          <v-icon color="white" size="28">mdi-plus</v-icon>
        </div>
        <div class="fab-ripple"></div>
        <div class="fab-ripple-2"></div>
      </button>
    </div>

    <!-- Toast Notification -->
    <ToastNotification
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </div>
</template>

<script src="./OnsitePayments.js"></script>
<style scoped src="./OnsitePayments.css"></style>
