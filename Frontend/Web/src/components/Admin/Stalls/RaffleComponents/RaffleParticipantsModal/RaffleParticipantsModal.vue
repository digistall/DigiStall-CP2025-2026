<template>
  <v-dialog v-model="show" max-width="900px" persistent>
    <v-card class="raffle-participants-modal">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <div class="header-info">
            <div class="header-icon">
              <v-icon size="32" color="white">mdi-ticket-percent</v-icon>
            </div>
            <div class="header-text">
              <h2 class="header-title">Raffle Participants</h2>
              <p class="header-subtitle" v-if="stallInfo">
                {{ stallInfo.stallNumber }} - {{ stallInfo.location }}
              </p>
            </div>
          </div>
          <v-btn icon size="large" color="white" variant="text" @click="handleClose" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Stall & Raffle Info Cards -->
      <div class="info-cards-container" v-if="stallInfo || raffleInfo">
        <div class="info-card stall-info" v-if="stallInfo">
          <div class="info-card-header">
            <v-icon color="primary" size="20">mdi-store</v-icon>
            <span>Stall Information</span>
          </div>
          <div class="info-card-content">
            <div class="info-row">
              <span class="label">Branch:</span>
              <span class="value">{{ stallInfo.branchName }}</span>
            </div>
            <div class="info-row">
              <span class="label">Floor/Section:</span>
              <span class="value">{{ stallInfo.floorName }} / {{ stallInfo.sectionName }}</span>
            </div>
            <div class="info-row">
              <span class="label">Rental Price:</span>
              <span class="value price">₱{{ formatPrice(stallInfo.rentalPrice) }}</span>
            </div>
          </div>
        </div>

        <div class="info-card raffle-info" v-if="raffleInfo">
          <div class="info-card-header">
            <v-icon color="primary" size="20">mdi-information</v-icon>
            <span>Raffle Status</span>
          </div>
          <div class="info-card-content">
            <div class="info-row">
              <span class="label">Status:</span>
              <v-chip
                :color="getRaffleStatusColor(raffleInfo.status)"
                size="small"
                variant="flat"
              >
                {{ raffleInfo.status || 'N/A' }}
              </v-chip>
            </div>
            <div class="info-row">
              <span class="label">Total Participants:</span>
              <span class="value highlight">{{ raffleInfo.totalParticipants || 0 }}</span>
            </div>
            <div class="info-row" v-if="raffleInfo.endTime">
              <span class="label">End Time:</span>
              <span class="value">{{ formatDateTime(raffleInfo.endTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-content">
          <v-progress-circular indeterminate size="48" color="primary" :width="4"></v-progress-circular>
          <p class="loading-text">Loading participants...</p>
        </div>
      </div>

      <!-- Error State -->
      <v-alert v-if="error && !loading" type="error" variant="tonal" class="error-alert mx-4 my-2">
        <template v-slot:prepend>
          <v-icon>mdi-alert-circle</v-icon>
        </template>
        <div class="error-content">
          <div class="error-title">Failed to load participants</div>
          <div class="error-message">{{ error }}</div>
        </div>
        <template v-slot:append>
          <v-btn color="error" variant="text" @click="fetchParticipants" size="small">
            <v-icon start>mdi-refresh</v-icon>
            Retry
          </v-btn>
        </template>
      </v-alert>

      <!-- Participants List -->
      <div v-if="!loading && !error" class="participants-content">
        <!-- Empty State -->
        <div v-if="participants.length === 0" class="empty-state">
          <div class="empty-icon">
            <v-icon size="80" color="grey-lighten-2">mdi-account-off-outline</v-icon>
          </div>
          <h3 class="empty-title">No participants yet</h3>
          <p class="empty-subtitle">
            No one has joined this raffle yet. Participants will appear here once they click "Join Raffle" on the mobile app.
          </p>
        </div>

        <!-- Participants Table -->
        <div v-else class="participants-table-container">
          <v-table class="participants-table" density="comfortable">
            <thead>
              <tr>
                <th class="text-left">#</th>
                <th class="text-left">Participant</th>
                <th class="text-left">Contact</th>
                <th class="text-left">Business</th>
                <th class="text-left">Joined At</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(participant, index) in participants"
                :key="participant.participantId"
                :class="{ 'winner-row': participant.isWinner }"
              >
                <td>{{ index + 1 }}</td>
                <td>
                  <div class="participant-info">
                    <div class="participant-avatar">
                      <span class="avatar-text">
                        {{ getInitials(participant.personalInfo.fullName) }}
                      </span>
                    </div>
                    <div class="participant-details">
                      <div class="participant-name">
                        {{ participant.personalInfo.fullName }}
                        <v-icon v-if="participant.isWinner" color="amber" size="small" class="ml-1">
                          mdi-crown
                        </v-icon>
                      </div>
                      <div class="participant-email">{{ participant.personalInfo.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="contact-info">
                    <div>{{ participant.personalInfo.contactNumber }}</div>
                    <div class="address-text">{{ truncateText(participant.personalInfo.address, 30) }}</div>
                  </div>
                </td>
                <td>
                  <div class="business-info">
                    <div class="business-name">{{ participant.businessInfo.name }}</div>
                    <div class="business-type">{{ participant.businessInfo.type }}</div>
                  </div>
                </td>
                <td>
                  <div class="joined-date">{{ formatDateTime(participant.joinedAt) }}</div>
                </td>
                <td class="text-center">
                  <v-chip
                    v-if="participant.isWinner"
                    color="success"
                    size="small"
                    variant="flat"
                  >
                    <v-icon start size="small">mdi-trophy</v-icon>
                    Winner
                  </v-chip>
                  <v-chip
                    v-else
                    color="primary"
                    size="small"
                    variant="outlined"
                  >
                    Participating
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <!-- Summary Footer -->
        <div v-if="participants.length > 0" class="participants-summary">
          <v-icon color="primary" size="small" class="mr-2">mdi-account-group</v-icon>
          <span>Total: <strong>{{ participants.length }}</strong> participant{{ participants.length !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <!-- Actions Footer -->
      <v-card-actions class="modal-actions">
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="handleClose">
          Close
        </v-btn>
        <v-btn
          v-if="participants.length > 0 && !hasWinner && raffleInfo?.status === 'Active'"
          color="primary"
          variant="elevated"
          @click="handleSelectWinner"
          :loading="selectingWinner"
        >
          <v-icon start>mdi-trophy</v-icon>
          Select Winner
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./RaffleParticipantsModal.js"></script>
<style scoped src="./RaffleParticipantsModal.css"></style>
