<template>
  <v-dialog v-model="show" max-width="900px" persistent>
    <v-card class="auction-participants-modal">
      <!-- Header -->
      <div class="modal-header auction-header">
        <div class="header-content">
          <div class="header-info">
            <div class="header-icon">
              <v-icon size="32" color="white">mdi-gavel</v-icon>
            </div>
            <div class="header-text">
              <h2 class="header-title">Auction Bidders</h2>
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
              <span class="label">Starting Price:</span>
              <span class="value price">₱{{ formatPrice(stallInfo.startingPrice || stallInfo.rentalPrice) }}</span>
            </div>
          </div>
        </div>

        <div class="info-card auction-info" v-if="auctionInfo">
          <div class="info-card-header">
            <v-icon color="amber-darken-2" size="20">mdi-gavel</v-icon>
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
              <span class="label">Total Bidders:</span>
              <span class="value highlight">{{ auctionInfo.totalBidders || 0 }}</span>
            </div>
            <div class="info-row">
              <span class="label">Highest Bid:</span>
              <span class="value price highlight">₱{{ formatPrice(auctionInfo.highestBid || 0) }}</span>
            </div>
            <div class="info-row" v-if="auctionInfo.endTime">
              <span class="label">End Time:</span>
              <span class="value">{{ formatDateTime(auctionInfo.endTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-content">
          <v-progress-circular indeterminate size="48" color="amber-darken-2" :width="4"></v-progress-circular>
          <p class="loading-text">Loading bidders...</p>
        </div>
      </div>

      <!-- Error State -->
      <v-alert v-if="error && !loading" type="error" variant="tonal" class="error-alert mx-4 my-2">
        <template v-slot:prepend>
          <v-icon>mdi-alert-circle</v-icon>
        </template>
        <div class="error-content">
          <div class="error-title">Failed to load bidders</div>
          <div class="error-message">{{ error }}</div>
        </div>
        <template v-slot:append>
          <v-btn color="error" variant="text" @click="fetchBidders" size="small">
            <v-icon start>mdi-refresh</v-icon>
            Retry
          </v-btn>
        </template>
      </v-alert>

      <!-- Bidders List -->
      <div v-if="!loading && !error" class="participants-content">
        <!-- Empty State -->
        <div v-if="bidders.length === 0" class="empty-state">
          <div class="empty-icon">
            <v-icon size="80" color="grey-lighten-2">mdi-account-off-outline</v-icon>
          </div>
          <h3 class="empty-title">No bidders yet</h3>
          <p class="empty-subtitle">
            No one has placed a bid on this auction yet. Bidders will appear here once they submit bids on the mobile app.
          </p>
        </div>

        <!-- Bidders Table -->
        <div v-else class="participants-table-container">
          <v-table class="participants-table" density="comfortable">
            <thead>
              <tr>
                <th class="text-left">#</th>
                <th class="text-left">Bidder</th>
                <th class="text-left">Contact</th>
                <th class="text-right">Bid Amount</th>
                <th class="text-left">Bid Time</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(bidder, index) in bidders"
                :key="bidder.bidderId"
                :class="{ 'winner-row': bidder.isWinner, 'highest-row': isHighestBidder(bidder) && !bidder.isWinner }"
              >
                <td>{{ index + 1 }}</td>
                <td>
                  <div class="participant-info">
                    <div class="participant-avatar" :class="{ 'highest-avatar': isHighestBidder(bidder) }">
                      <span class="avatar-text">
                        {{ getInitials(bidder.personalInfo.fullName) }}
                      </span>
                    </div>
                    <div class="participant-details">
                      <div class="participant-name">
                        {{ bidder.personalInfo.fullName }}
                        <v-icon v-if="bidder.isWinner" color="amber" size="small" class="ml-1">
                          mdi-trophy
                        </v-icon>
                        <v-icon v-else-if="isHighestBidder(bidder)" color="amber-darken-2" size="small" class="ml-1">
                          mdi-chevron-triple-up
                        </v-icon>
                      </div>
                      <div class="participant-email">{{ bidder.personalInfo.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="contact-info">
                    <v-icon size="small" color="grey-darken-1" class="mr-1">mdi-phone</v-icon>
                    {{ bidder.personalInfo.contactNumber || 'N/A' }}
                  </div>
                </td>
                <td class="text-right">
                  <span class="bid-amount" :class="{ 'highest-bid': isHighestBidder(bidder) }">
                    ₱{{ formatPrice(bidder.bidAmount) }}
                  </span>
                </td>
                <td>
                  <div class="time-info">
                    <v-icon size="small" color="grey-darken-1" class="mr-1">mdi-clock-outline</v-icon>
                    {{ formatDateTime(bidder.bidTime) }}
                  </div>
                </td>
                <td class="text-center">
                  <v-chip
                    v-if="bidder.isWinner"
                    color="success"
                    size="small"
                    variant="flat"
                  >
                    <v-icon start size="small">mdi-trophy</v-icon>
                    Winner
                  </v-chip>
                  <v-chip
                    v-else-if="isHighestBidder(bidder)"
                    color="amber-darken-2"
                    size="small"
                    variant="flat"
                  >
                    <v-icon start size="small">mdi-arrow-up-bold</v-icon>
                    Highest
                  </v-chip>
                  <v-chip
                    v-else
                    color="grey"
                    size="small"
                    variant="outlined"
                  >
                    Outbid
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <!-- Select Winner Button -->
        <div v-if="bidders.length > 0 && !hasWinner" class="action-footer">
          <v-btn
            color="amber-darken-2"
            size="large"
            variant="elevated"
            @click="handleSelectWinner"
            :loading="selectingWinner"
            :disabled="selectingWinner"
            class="select-winner-btn"
          >
            <v-icon start>mdi-trophy</v-icon>
            Confirm Highest Bidder as Winner
          </v-btn>
          <p class="action-hint">
            This will confirm {{ highestBidder?.personalInfo?.fullName || 'the highest bidder' }} 
            with bid ₱{{ formatPrice(highestBidder?.bidAmount || 0) }} as the winner.
          </p>
        </div>

        <!-- Winner Already Selected Message -->
        <div v-if="hasWinner" class="winner-selected-message">
          <v-alert type="success" variant="tonal" class="mx-4 mb-4">
            <template v-slot:prepend>
              <v-icon>mdi-trophy</v-icon>
            </template>
            <div class="winner-message-content">
              <div class="winner-title">Auction Completed!</div>
              <div class="winner-text">
                A winner has been selected for this auction.
              </div>
            </div>
          </v-alert>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script src="./AuctionParticipantsModal.js"></script>
<style scoped src="./AuctionParticipantsModal.css"></style>
