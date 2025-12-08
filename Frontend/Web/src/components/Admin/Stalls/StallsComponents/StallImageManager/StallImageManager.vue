<template>
  <div class="stall-image-manager">
    <!-- Upload Section -->
    <v-card class="mb-4" elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="me-2">mdi-image-multiple</v-icon>
        Stall Images ({{ images.length }}/10)
      </v-card-title>
      
      <v-card-text>
        <!-- File Input -->
        <v-file-input
          v-model="selectedFiles"
          label="Upload Images"
          variant="outlined"
          prepend-inner-icon="mdi-camera"
          accept="image/png,image/jpeg,image/jpg"
          multiple
          show-size
          counter
          :rules="fileRules"
          :disabled="isUploading || images.length >= 10"
          @change="handleFileSelection"
          chips
        >
          <template v-slot:selection="{ fileNames }">
            <template v-for="(fileName, index) in fileNames" :key="fileName">
              <v-chip
                v-if="index < 2"
                size="small"
                color="primary"
                class="me-2"
              >
                {{ fileName }}
              </v-chip>
              <span
                v-else-if="index === 2"
                class="text-overline grey--text text--darken-3 mx-2"
              >
                +{{ fileNames.length - 2 }} File(s)
              </span>
            </template>
          </template>
        </v-file-input>

        <!-- Upload Button -->
        <v-btn
          v-if="selectedFiles.length > 0"
          color="primary"
          :loading="isUploading"
          :disabled="images.length + selectedFiles.length > 10"
          @click="uploadImages"
          class="mt-2"
        >
          <v-icon left>mdi-cloud-upload</v-icon>
          Upload {{ selectedFiles.length }} Image(s)
        </v-btn>

        <!-- Warning Message -->
        <v-alert
          v-if="images.length >= 10"
          type="warning"
          density="compact"
          class="mt-3"
        >
          Maximum of 10 images reached. Delete an image to upload a new one.
        </v-alert>

        <v-alert
          v-if="selectedFiles.length + images.length > 10"
          type="error"
          density="compact"
          class="mt-3"
        >
          Cannot upload {{ selectedFiles.length }} images. You can only upload {{ 10 - images.length }} more image(s).
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Image Gallery -->
    <v-card elevation="2">
      <v-card-title>
        <v-icon class="me-2">mdi-view-gallery</v-icon>
        Image Gallery
      </v-card-title>

      <v-card-text>
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-5">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <p class="mt-3 text-grey">Loading images...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="images.length === 0" class="text-center py-5">
          <v-icon size="64" color="grey-lighten-1">mdi-image-off</v-icon>
          <p class="text-grey mt-3">No images uploaded yet</p>
          <p class="text-caption text-grey">Upload images to showcase your stall</p>
        </div>

        <!-- Image Grid -->
        <v-row v-else>
          <v-col
            v-for="image in sortedImages"
            :key="image.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card elevation="3" class="image-card">
              <!-- Image -->
              <v-img
                :src="image.image_url"
                height="200"
                cover
                class="rounded-t"
              >
                <template v-slot:placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <v-progress-circular
                      color="grey-lighten-4"
                      indeterminate
                    ></v-progress-circular>
                  </div>
                </template>
                <template v-slot:error>
                  <div class="d-flex align-center justify-center fill-height bg-grey-lighten-2">
                    <v-icon color="error" size="48">mdi-image-broken</v-icon>
                  </div>
                </template>
              </v-img>

              <!-- Primary Badge -->
              <v-chip
                v-if="image.is_primary"
                color="success"
                size="small"
                class="primary-badge"
              >
                <v-icon left size="small">mdi-star</v-icon>
                Primary
              </v-chip>

              <!-- Actions -->
              <v-card-actions class="d-flex justify-space-between pa-2">
                <v-btn
                  v-if="!image.is_primary"
                  size="small"
                  color="primary"
                  variant="text"
                  @click="setPrimary(image.id)"
                  :disabled="isUpdating"
                >
                  <v-icon size="small">mdi-star-outline</v-icon>
                  Set Primary
                </v-btn>
                <span v-else class="text-caption text-grey">
                  Order: {{ image.display_order }}
                </span>

                <v-btn
                  size="small"
                  color="error"
                  variant="text"
                  @click="confirmDelete(image)"
                  :disabled="isDeleting"
                >
                  <v-icon size="small">mdi-delete</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="error" class="me-2">mdi-alert</v-icon>
          Delete Image
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this image? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
            :disabled="isDeleting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="deleteImage"
            :loading="isDeleting"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import apiClient from '@/services/apiClient'

export default {
  name: 'StallImageManager',
  
  props: {
    stallId: {
      type: [Number, String],
      required: true
    },
    branchId: {
      type: [Number, String],
      required: true
    },
    stallNumber: {
      type: [Number, String],
      required: true
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      images: [],
      selectedFiles: [],
      isLoading: false,
      isUploading: false,
      isDeleting: false,
      isUpdating: false,
      showDeleteDialog: false,
      imageToDelete: null,
      fileRules: [
        files => !files || files.length === 0 || files.length <= 10 || 'Maximum 10 files allowed',
        files => !files || files.length === 0 || files.every(f => f.size <= 2097152) || 'Each file must be less than 2MB',
        files => !files || files.length === 0 || files.every(f => ['image/png', 'image/jpeg', 'image/jpg'].includes(f.type)) || 'Only PNG and JPG files allowed'
      ]
    }
  },
  
  computed: {
    sortedImages() {
      return [...this.images].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return a.display_order - b.display_order
      })
    }
  },
  
  mounted() {
    this.loadImages()
  },
  
  methods: {
    async loadImages() {
      this.isLoading = true
      
      try {
        const response = await apiClient.get(`/stalls/${this.stallId}/images`)
        
        if (response.data.success) {
          this.images = response.data.data.images
        }
      } catch (error) {
        console.error('Error loading images:', error)
        this.$emit('error', error.response?.data?.message || 'Failed to load images')
      } finally {
        this.isLoading = false
      }
    },
    
    handleFileSelection() {
      if (!this.selectedFiles || this.selectedFiles.length === 0) return
      
      // Validate file count
      if (this.images.length + this.selectedFiles.length > 10) {
        this.$emit('error', `Cannot upload ${this.selectedFiles.length} images. Maximum is 10 images per stall. You have ${this.images.length} images already.`)
      }
    },
    
    async uploadImages() {
      if (this.selectedFiles.length === 0) return
      
      this.isUploading = true
      
      try {
        const formData = new FormData()
        
        // Append files
        this.selectedFiles.forEach(file => {
          formData.append('images', file)
        })
        
        // Append metadata
        formData.append('stall_id', this.stallId)
        formData.append('branch_id', this.branchId)
        formData.append('stall_number', this.stallNumber)
        formData.append('is_primary', this.images.length === 0 ? 'true' : 'false')
        
        const response = await apiClient.post(
          `/stalls/${this.stallId}/images/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )
        
        if (response.data.success) {
          this.$emit('success', response.data.message)
          this.selectedFiles = []
          await this.loadImages()
        }
      } catch (error) {
        console.error('Error uploading images:', error)
        this.$emit('error', error.response?.data?.message || 'Failed to upload images')
      } finally {
        this.isUploading = false
      }
    },
    
    confirmDelete(image) {
      this.imageToDelete = image
      this.showDeleteDialog = true
    },
    
    async deleteImage() {
      if (!this.imageToDelete) return
      
      this.isDeleting = true
      
      try {
        const response = await apiClient.delete(
          `/stalls/images/${this.imageToDelete.id}`
        )
        
        if (response.data.success) {
          this.$emit('success', 'Image deleted successfully')
          this.showDeleteDialog = false
          this.imageToDelete = null
          await this.loadImages()
        }
      } catch (error) {
        console.error('Error deleting image:', error)
        this.$emit('error', error.response?.data?.message || 'Failed to delete image')
      } finally {
        this.isDeleting = false
      }
    },
    
    async setPrimary(imageId) {
      this.isUpdating = true
      
      try {
        const response = await apiClient.put(
          `/stalls/images/${imageId}/set-primary`,
          {}
        )
        
        if (response.data.success) {
          this.$emit('success', 'Primary image updated')
          await this.loadImages()
        }
      } catch (error) {
        console.error('Error setting primary image:', error)
        this.$emit('error', error.response?.data?.message || 'Failed to set primary image')
      } finally {
        this.isUpdating = false
      }
    }
  }
}
</script>

<style scoped>
.stall-image-manager {
  width: 100%;
}

.image-card {
  position: relative;
  transition: transform 0.2s;
}

.image-card:hover {
  transform: translateY(-4px);
}

.primary-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}
</style>
