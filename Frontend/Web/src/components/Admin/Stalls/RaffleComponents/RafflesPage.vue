<template>
  <div class="raffles-page">
    <active-raffles
      @show-message="handleMessage"
      @view-raffle-details="handleViewDetails"
      @view-raffle-participants="handleViewParticipants"
    />

    <!-- Use the separate RaffleDetailsPopup component -->
    <raffle-details-popup
      :show-details-modal="showDetailsModal"
      :selected-raffle="selectedRaffle"
      :show-participants-modal="showParticipantsModal"
      :selected-raffle-for-participants="selectedRaffleForParticipants"
      @close-details-modal="closeDetailsModal"
      @close-participants-modal="closeParticipantsModal"
    />

    <!-- Toast Notification -->
    <ToastNotification
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </div>
</template>

<script src="./RafflesPage.js"></script>
<style src="./RafflesPage.css"></style>
