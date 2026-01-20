<template>
  <v-dialog v-model="isVisible" max-width="900px" @click:outside="closeModal">
    <v-card>
      <v-card-title class="documents-header">
        <h3>Documents - {{ stallholder.full_name || stallholder.name }}</h3>
        <v-btn icon @click="closeModal">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-4">Loading documents...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8">
          <v-icon color="error" size="48">mdi-alert-circle</v-icon>
          <p class="mt-4 text-error">{{ error }}</p>
          <v-btn color="primary" @click="fetchStallholderDocuments">
            Retry
          </v-btn>
        </div>

        <!-- Empty State -->
        <div v-else-if="documents.length === 0" class="text-center py-8">
          <v-icon size="48" color="grey">mdi-file-document-outline</v-icon>
          <p class="mt-4">No documents found</p>
        </div>

        <!-- Documents List -->
        <div v-else class="documents-list">
          <div 
            v-for="document in documents" 
            :key="document.id"
            class="document-item"
            @click="viewDocument(document)"
          >
            <div class="document-info">
              <v-icon class="document-icon">
                {{ document.type === 'pdf' ? 'mdi-file-pdf' : 'mdi-file-image' }}
              </v-icon>
              <div>
                <h4>{{ document.name }}</h4>
                <p class="text-caption">Uploaded: {{ document.uploadDate }}</p>
              </div>
            </div>
            <v-chip 
              :class="getStatusClass(document.status)"
              small
            >
              {{ document.status }}
            </v-chip>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script src="./DocumentsView.js"></script>
<style scoped src="./DocumentsView.css"></style>