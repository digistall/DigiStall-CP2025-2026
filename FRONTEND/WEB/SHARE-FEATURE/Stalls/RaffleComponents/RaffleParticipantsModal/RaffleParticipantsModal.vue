<template>
  <v-dialog v-model="show" max-width="1200px" persistent>
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
                <th class="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(participant, index) in participants" 
                :key="participant.participantId"
                :class="{ 'winner-row': participant.isWinner, 'clickable-row': true }"
                @click="openParticipantDetail(participant)"
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
                        <v-chip v-if="participant.stallholderId || participant.stallCount > 0" color="info" size="x-small" class="ml-1">
                          Stallholder
                        </v-chip>
                        <v-chip v-if="participant.stallCount >= 2" color="error" size="x-small" class="ml-1">
                          <v-icon start size="x-small">mdi-alert</v-icon>
                          Max Stalls ({{ participant.stallCount }}/2)
                        </v-chip>
                        <v-chip v-else-if="participant.stallCount === 1" color="warning" size="x-small" class="ml-1">
                          {{ participant.stallCount }}/2 Stalls
                        </v-chip>
                        <v-icon v-if="participant.isWinner" color="amber" size="small" class="ml-1">
                          mdi-crown
                        </v-icon>
                      </div>
                      <div class="participant-email" v-if="participant.personalInfo.email && participant.personalInfo.email !== 'N/A'">{{ participant.personalInfo.email }}</div>
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
                    <div class="business-name">{{ participant.personalInfo.businessName || 'N/A' }}</div>
                  </div>
                </td>
                <td>
                  <div class="joined-date">{{ formatDateTime(participant.joinedAt) }}</div>
                </td>
                <td class="text-center" @click.stop>
                  <v-chip 
                    v-if="participant.isWinner"
                    color="success" 
                    size="small" 
                    variant="flat"
                  >
                    <v-icon start size="small">mdi-trophy</v-icon>
                    Winner
                  </v-chip>
                  <v-btn 
                    v-else
                    color="success" 
                    size="small" 
                    variant="flat"
                    @click="handleSelectWinnerForParticipant(participant.participantId)"
                    :loading="selectingWinner"
                    :disabled="hasWinner || raffleInfo?.status !== 'Open'"
                  >
                    <v-icon start size="small">mdi-crown</v-icon>
                    Pick Winner
                  </v-btn>
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
      <v-card-actions v-if="participants.length > 0 && !hasWinner && raffleInfo?.status === 'Active'" class="modal-actions">
        <v-spacer></v-spacer>
        <v-btn 
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

    <!-- Participant Detail Modal -->
    <ParticipantDetailModal
      :show="showParticipantDetail"
      :applicantId="selectedApplicantId"
      @close="closeParticipantDetail"
    />

    <!-- Max Stalls Warning Dialog -->
    <v-dialog v-model="showMaxStallsDialog" max-width="500px">
      <v-card>
        <v-card-title class="d-flex align-center pa-4" style="background-color: #FF5252; color: white;">
          <v-icon color="white" class="mr-2">mdi-alert-circle</v-icon>
          Maximum Stalls Reached
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="text-body-1 mb-3">
            <strong>{{ maxStallsParticipantName }}</strong> already owns the maximum number of stalls allowed (2 stalls).
          </p>
          <p class="text-body-2 text-grey-darken-1 mb-3">
            Each person can only rent up to <strong>2 stalls</strong> across all branches and stall types (Fixed Price, Auction, Raffle).
          </p>
          <div v-if="maxStallsExistingStalls.length > 0" class="mt-3">
            <p class="text-subtitle-2 font-weight-bold mb-2">Current stalls owned:</p>
            <v-list density="compact" class="rounded border">
              <v-list-item v-for="(stall, idx) in maxStallsExistingStalls" :key="idx">
                <template v-slot:prepend>
                  <v-icon color="primary" size="small">mdi-store</v-icon>
                </template>
                <v-list-item-title>{{ stall.stallNumber }}</v-list-item-title>
                <v-list-item-subtitle>{{ stall.branch }} - {{ stall.type }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="elevated" @click="showMaxStallsDialog = false">
            Understood
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script src="./RaffleParticipantsModal.js"></script>
<style scoped src="./RaffleParticipantsModal.css"></style>
