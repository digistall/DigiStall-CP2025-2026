<template>
  <v-dialog v-model="show" max-width="900px" persistent>
    <v-card class="auction-participants-modal">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <div class="header-info">
            <div class="header-icon">
              <v-icon size="32" color="white">mdi-gavel</v-icon>
            </div>
            <div class="header-text">
              <h2 class="header-title">Auction Participants</h2>
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

      <!-- Stall & Auction Info Cards -->
      <div class="info-cards-container" v-if="stallInfo || auctionInfo">
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
              <span class="label">Starting Bid:</span>
              <span class="value price">₱{{ formatPrice(auctionInfo?.startingBid || stallInfo.rentalPrice) }}</span>
            </div>
          </div>
        </div>

        <div class="info-card auction-info" v-if="auctionInfo">
          <div class="info-card-header">
            <v-icon color="primary" size="20">mdi-information</v-icon>
            <span>Auction Status</span>
          </div>
          <div class="info-card-content">
            <div class="info-row">
              <span class="label">Status:</span>
              <v-chip 
                :color="getAuctionStatusColor(auctionInfo.status)" 
                size="small" 
                variant="flat"
              >
                {{ auctionInfo.status || 'N/A' }}
              </v-chip>
            </div>
            <div class="info-row">
              <span class="label">Total Participants:</span>
              <span class="value highlight">{{ participants.length || 0 }}</span>
            </div>
            <div class="info-row" v-if="auctionInfo.endDate">
              <span class="label">End Date:</span>
              <span class="value">{{ formatDateTime(auctionInfo.endDate) }}</span>
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
            No one has joined this auction yet. Participants will appear here once they click "Join Auction" on the mobile app.
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
                <th class="text-right">Highest Bid</th>
                <th class="text-left">Joined At</th>
                <th class="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(participant, index) in sortedParticipants" 
                :key="participant.participantId"
                :class="{ 'winner-row': participant.isWinner, 'highest-bidder': index === 0 && participant.highestBid > 0 }"
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
                        <v-chip v-if="participant.stallholderId" color="info" size="x-small" class="ml-1">
                          Stallholder
                        </v-chip>
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
                    <div class="business-name">{{ participant.personalInfo.businessName || 'N/A' }}</div>
                  </div>
                </td>
                <td class="text-right">
                  <div class="bid-amount" :class="{ 'highest': index === 0 && participant.highestBid > 0 }">
                    {{ participant.highestBid > 0 ? '₱' + formatPrice(participant.highestBid) : 'No bid' }}
                  </div>
                </td>
                <td>
                  <div class="joined-date">{{ formatDateTime(participant.joinedAt) }}</div>
                </td>
                <td class="text-center">
                  <v-btn
                    v-if="!participant.isWinner && auctionInfo?.status === 'Open'"
                    color="success"
                    variant="elevated"
                    size="small"
                    @click="handleSelectWinner(participant)"
                    :loading="selectingWinner === participant.participantId"
                  >
                    <v-icon start size="small">mdi-trophy</v-icon>
                    Pick Winner
                  </v-btn>
                  <v-chip 
                    v-else-if="participant.isWinner"
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
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script src="./AuctionParticipantsModal.js"></script>
<style scoped src="./AuctionParticipantsModal.css"></style>
