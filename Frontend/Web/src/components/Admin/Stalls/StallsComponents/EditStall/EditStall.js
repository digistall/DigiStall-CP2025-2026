import DeleteStall from '../DeleteStall/DeleteStall.vue'
import { eventBus, EVENTS } from '../../../../../eventBus.js'

export default {
  name: 'EditStall',
  components: {
    DeleteStall,
  },
  props: {
    stallData: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    showModal: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      editForm: this.getEmptyForm(),
      selectedImageFile: null,
      imagePreview: null,
      showDeleteConfirm: false,
      valid: false,
      loading: false,
      // Multi-image gallery data
      stallImages: [],
      currentImageIndex: 0,
      loadingImages: false,
      imageBaseUrl: import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost',
      rules: {
        stallNumber: [
          (v) => !!v || 'Stall number is required',
          (v) => (v && v.length >= 3) || 'Stall number must be at least 3 characters',
        ],
        price: [
          (v) => !!v || 'Price is required',
          (v) => {
            // Allow various price formats: 1500, 1,500, ₱1500, PHP1500, 1500.00, etc.
            const cleanPrice = String(v)
              .replace(/[₱,\s]/g, '')
              .replace(/php/gi, '')
            return (
              (!isNaN(cleanPrice) && parseFloat(cleanPrice) > 0) ||
              'Please enter a valid price (numbers only)'
            )
          },
        ],
        floor: [(v) => !!v || 'Floor is required'],
        section: [(v) => !!v || 'Section is required'],
        size: [
          (v) => !!v || 'Size is required',
          (v) => /^\d+x\d+/i.test(v) || 'Size format should be like "3x3" or "3x3 meters"',
        ],
        location: [(v) => !!v || 'Location is required'],
        description: [
          (v) => !!v || 'Description is required',
          (v) => (v && v.length >= 10) || 'Description must be at least 10 characters',
        ],
      },
      imageRules: [
        (v) => !v || v.size < 5000000 || 'Image size should be less than 5 MB!',
        (v) =>
          !v ||
          ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(v.type) ||
          'Only JPEG, PNG, GIF, and WebP images are allowed!',
      ],
      // API base URL
      apiBaseUrl: (() => {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      })(),
    }
  },
  computed: {
    // Check if user is a business owner (view-only access)
    isBusinessOwner() {
      const userType = sessionStorage.getItem('userType')
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')
      return userType === 'stall_business_owner' || currentUser.userType === 'stall_business_owner'
    },
  },
  watch: {
    stallData: {
      handler(newData, oldData) {
        console.log('👀 stallData watcher triggered')
        console.log('New data:', newData)
        console.log('Old data:', oldData)

        if (newData && Object.keys(newData).length) {
          console.log('📝 Populating form with new data')
          this.populateForm(newData)
          // Fetch images from htdocs after populating form
          this.fetchStallImagesFromHtdocs(newData)
        } else {
          console.log('⚠️ stallData is empty or undefined - modal may be closing')
          // Don't clear form data when stallData becomes empty
          // This happens when the parent closes the modal
        }
      },
      immediate: true,
      deep: true,
    },
    showModal: {
      handler(newVal) {
        if (!newVal) {
          // Clear images when modal closes
          this.stallImages = []
          this.currentImageIndex = 0
        }
      }
    }
  },
  methods: {
    closeModal() {
      this.resetForm()
      this.$emit('close')
    },

    getEmptyForm() {
      return {
        id: null,
        stallNumber: '',
        price: '',
        floor: '',
        floorId: null, // Store floor ID separately
        section: '',
        sectionId: null, // Store section ID separately
        size: '',
        location: '',
        description: '',
        image: null,
        isAvailable: true,
        priceType: 'Fixed Price',
      }
    },

    populateForm(data) {
      console.log('Populating form with data:', data)
      console.log('Available ID fields:', {
        stall_id: data.stall_id,
        ID: data.ID,
        id: data.id,
      })

      const extractedId = data.stall_id || data.ID || data.id
      console.log('Extracted ID:', extractedId)

      this.editForm = {
        id: extractedId,
        stallNumber: data.stall_no || data.stallNumber || '',
        price: this.extractNumericPrice(data.rental_price || data.price) || '',
        floor: data.floor_name || data.floor || '',
        floorId: data.floor_id || data.floorId || null,
        section: data.section_name || data.section || '',
        sectionId: data.section_id || data.sectionId || null,
        size: data.size || data.dimensions || '',
        location: data.stall_location || data.location || '',
        description: data.description || '',
        image: data.stall_image || data.image || null,
        isAvailable: data.status === 'Active' || data.isAvailable === true,
        priceType: data.price_type || data.priceType || 'Fixed Price',
      }

      // Don't set imagePreview from existing image - only set it for newly uploaded images
      // This allows the gallery to show instead of the upload preview
      this.imagePreview = null
      this.selectedImageFile = null
      console.log('Form populated:', this.editForm)
    },

    extractNumericPrice(priceString) {
      if (!priceString) return ''

      const numericPart = String(priceString)
        .replace(/[₱,\s]/g, '')
        .replace(/php/gi, '')
        .replace(/\/.*$/i, '')
        .trim()

      return numericPart
    },

    async handleSave() {
      this.loading = true

      try {
        console.log('Saving stall with form data:', this.editForm)

        // Safety check: Ensure we have a valid stall ID
        if (!this.editForm.id) {
          console.error('❌ Cannot save: Stall ID is missing!')
          console.log('Current editForm:', this.editForm)
          console.log('Current stallData prop:', this.stallData)
          this.$emit(
            'error',
            'Unable to save: Stall ID is missing. Please close and reopen the edit dialog.',
          )
          this.loading = false
          return
        }

        console.log('✅ Saving stall with ID:', this.editForm.id)

        // Basic field validation
        const requiredFields = {
          stallNumber: 'Stall number',
          price: 'Price',
          floor: 'Floor',
          section: 'Section',
          location: 'Location',
          description: 'Description',
        }

        const missingFields = []
        for (const [field, label] of Object.entries(requiredFields)) {
          if (!this.editForm[field] || String(this.editForm[field]).trim() === '') {
            missingFields.push(label)
          }
        }

        if (missingFields.length > 0) {
          console.error(`Missing fields: ${missingFields.join(', ')}`)
          return
        }

        // Validate size format
        if (this.editForm.size && !/^\d+x\d+/i.test(this.editForm.size)) {
          console.error('Invalid size format')
          return
        }

        // Handle image upload if new image is selected
        let imageData = this.editForm.image
        if (this.selectedImageFile) {
          if (this.selectedImageFile.size > 5000000) {
            console.error('Image size too large')
            return
          }

          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
          if (!allowedTypes.includes(this.selectedImageFile.type)) {
            console.error('Invalid image type')
            return
          }

          imageData = await this.processImageFile(this.selectedImageFile)
        }

        // Clean and validate price
        const cleanPrice = String(this.editForm.price)
          .replace(/[₱,\s]/g, '')
          .replace(/php/gi, '')
          .trim()

        const numericPrice = parseFloat(cleanPrice)

        if (isNaN(numericPrice) || numericPrice <= 0) {
          console.error('Invalid price')
          return
        }

        const updateData = {
          stall_no: this.editForm.stallNumber.trim(), // Backend expects stall_no
          price: numericPrice,
          floor_id: this.editForm.floorId, // Send floor ID instead of name
          section_id: this.editForm.sectionId, // Send section ID instead of name
          size: this.editForm.size ? this.editForm.size.trim() : null,
          location: this.editForm.location,
          description: this.editForm.description.trim(),
          image: imageData,
          isAvailable: this.editForm.isAvailable,
          priceType: this.editForm.priceType,
        }

        console.log('Sending update data to API:', updateData)

        // Double-check that we still have a valid ID before making the API call
        if (!this.editForm.id) {
          console.error('❌ ID became undefined before API call!')
          throw new Error('Stall ID is missing - cannot update stall')
        }

        console.log('🔗 Making API call to:', `${this.apiBaseUrl}/stalls/${this.editForm.id}`)

        const token = sessionStorage.getItem('authToken')

        if (!token) {
          console.error('No auth token found')
          this.$router.push('/login')
          return
        }

        const response = await fetch(`${this.apiBaseUrl}/stalls/${this.editForm.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        })

        const result = await response.json().catch(() => {
          return {
            success: false,
            message: response.statusText || 'Server error',
          }
        })
        console.log('API Response:', result)

        if (!response.ok) {
          if (response.status === 401) {
            console.error('Session expired')
            this.$emit('error', '🔒 Session Expired: Please login again to continue.')
            setTimeout(() => {
              this.$router.push('/login')
            }, 2000)
            return
          } else if (response.status === 403) {
            throw new Error('Access denied - you do not have permission to update this stall')
          } else if (response.status === 404) {
            throw new Error('Stall not found or you do not have permission to update it')
          }
          throw new Error(result.message || `Server error: ${response.status}`)
        }

        if (result.success) {
          console.log('🔄 Update successful - backend response:', result)

          // If backend returned updated stall data, use it
          if (result.data) {
            console.log('🔄 Sending raw backend data to parent for transformation')
            // Emit stall-updated event with raw backend data (parent will transform)
            this.$emit('stall-updated', result.data)
          } else {
            // If no data returned, just emit a refresh signal
            console.log('🔄 No data returned, emitting refresh signal')
            this.$emit('stall-updated', { stall_id: this.editForm.id })
          }

          // Emit global event for real-time sidebar update with toast notification
          eventBus.emit(EVENTS.STALL_UPDATED, {
            stallData: result.data || { stall_id: this.editForm.id },
            priceType: result.data?.priceType || result.data?.price_type || this.editForm.priceType,
            message: result.message || 'Stall updated successfully!',
          })

          // Close the modal after successful update
          this.closeModal()
        } else {
          throw new Error(result.message || 'Failed to update stall')
        }
      } catch (error) {
        console.error('Update stall error:', error)
        
        // Format error message with appropriate icon
        let errorMessage = '❌ Error: Failed to update stall'
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '❌ Network Error: Unable to connect to server. Please check your connection and try again.'
        } else if (error.message.includes('already exists')) {
          errorMessage = `⚠️ Duplicate Stall: ${error.message}`
        } else if (error.message.includes('Access denied')) {
          errorMessage = `🚫 Access Denied: ${error.message}`
        } else if (error.message.includes('Stall not found')) {
          errorMessage = `⚠️ Not Found: ${error.message}`
        } else if (error.message.includes('Invalid section')) {
          errorMessage = `⚠️ Invalid Section: ${error.message}`
        } else if (error.message) {
          errorMessage = `❌ Error: ${error.message}`
        }
        
        // Emit error event to parent component
        this.$emit('error', errorMessage)
      } finally {
        this.loading = false
      }
    },
    transformBackendData(stallData) {
      const transformed = {
        id: stallData.stall_id || stallData.ID || stallData.id,
        stallNumber: stallData.stall_no || stallData.stallNumber,
        price: this.formatPrice(
          stallData.rental_price || stallData.price,
          stallData.price_type || stallData.priceType,
        ),
        floor: stallData.floor_name || stallData.floor,
        floorId: stallData.floor_id || stallData.floorId,
        section: stallData.section_name || stallData.section,
        sectionId: stallData.section_id || stallData.sectionId,
        size: stallData.size, // Only use size, no dimensions
        location: stallData.stall_location || stallData.location,
        description: stallData.description,
        image: stallData.stall_image || stallData.image,
        isAvailable: stallData.status === 'Active',
        priceType: stallData.price_type || stallData.priceType,
        status: stallData.status,
        createdAt: stallData.created_at,
        updatedAt: stallData.updated_at,
        manager_first_name: stallData.manager_first_name,
        manager_last_name: stallData.manager_last_name,
        area: stallData.area,
        branch_location: stallData.branch_location,
      }

      return transformed
    },

    formatPrice(price, priceType) {
      const formattedPrice = `₱${parseFloat(price).toLocaleString()}`

      switch (priceType) {
        case 'Raffle':
          return `${formattedPrice} / Raffle`
        case 'Auction':
          return `${formattedPrice} Min. / Auction`
        case 'Fixed Price':
        default:
          return `${formattedPrice} / Fixed Price`
      }
    },

    handleStallDeleted(event) {
      console.log('✅ Stall deleted successfully:', event)
      this.$emit('stall-deleted', event.stallId)
      this.handleClose()
    },

    handleDeleteError(error) {
      console.error('❌ Delete error:', error)
      // Emit error to parent component with the formatted message
      const errorMessage = typeof error === 'object' ? error.message : error
      this.$emit('error', errorMessage)
      this.showDeleteConfirm = false
    },

    handleClose() {
      this.resetForm()
      this.$emit('close')
    },

    resetForm() {
      this.editForm = this.getEmptyForm()
      this.selectedImageFile = null
      this.imagePreview = null
      this.showDeleteConfirm = false
      this.stallImages = []
      this.currentImageIndex = 0
      if (this.$refs.editForm) this.$refs.editForm.resetValidation()
    },

    // Multi-image gallery methods
    async fetchStallImagesFromHtdocs(stallData) {
      const stallNo = stallData.stall_no || stallData.stallNumber
      const branchId = stallData.branch_id || stallData.branchId || 1

      if (!stallNo) {
        console.log('No stall number available for image fetching')
        return
      }

      console.log(`🖼️ Fetching images for stall ${stallNo} from htdocs...`)
      this.loadingImages = true
      this.stallImages = []

      try {
        const foundImages = []
        const maxImagesToCheck = 10

        // Check for numbered images (1.png, 2.png, etc.)
        for (let i = 1; i <= maxImagesToCheck; i++) {
          const imageUrl = `${this.imageBaseUrl}/digistall_uploads/stalls/${branchId}/${stallNo}/${i}.png`
          const exists = await this.checkImageExists(imageUrl)
          if (exists) {
            foundImages.push(imageUrl)
            console.log(`✅ Found image: ${imageUrl}`)
          }
        }

        // Also check for common naming patterns
        const patterns = ['main.png', 'primary.png', 'stall.png', 'image.png']
        for (const pattern of patterns) {
          const imageUrl = `${this.imageBaseUrl}/digistall_uploads/stalls/${branchId}/${stallNo}/${pattern}`
          const exists = await this.checkImageExists(imageUrl)
          if (exists && !foundImages.includes(imageUrl)) {
            foundImages.push(imageUrl)
            console.log(`✅ Found image: ${imageUrl}`)
          }
        }

        if (foundImages.length > 0) {
          this.stallImages = foundImages
          console.log(`📸 Found ${foundImages.length} images for stall ${stallNo}`)
        } else {
          // Fallback to the image from database
          if (stallData.stall_image || stallData.image) {
            this.stallImages = [stallData.stall_image || stallData.image]
            console.log('📸 Using database image as fallback')
          }
        }
      } catch (error) {
        console.error('Error fetching stall images:', error)
        // Fallback to database image
        if (stallData.stall_image || stallData.image) {
          this.stallImages = [stallData.stall_image || stallData.image]
        }
      } finally {
        this.loadingImages = false
        this.currentImageIndex = 0
      }
    },

    checkImageExists(url) {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = url
      })
    },

    nextImage() {
      if (this.stallImages.length > 1) {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.stallImages.length
      }
    },

    prevImage() {
      if (this.stallImages.length > 1) {
        this.currentImageIndex = (this.currentImageIndex - 1 + this.stallImages.length) % this.stallImages.length
      }
    },

    goToImage(index) {
      this.currentImageIndex = index
    },

    getCurrentImage() {
      if (this.stallImages.length > 0) {
        return this.stallImages[this.currentImageIndex]
      }
      return this.editForm.image || null
    },

    async deleteStallImage(imageUrl, index) {
      // Extract filename from URL
      const urlParts = imageUrl.split('/')
      const filename = urlParts[urlParts.length - 1]
      const stallNo = this.editForm.stallNumber
      const branchId = this.stallData.branch_id || this.stallData.branchId || 1

      console.log(`🗑️ Deleting image: ${filename} for stall ${stallNo}`)

      try {
        const token = sessionStorage.getItem('authToken')
        const response = await fetch(`${this.apiBaseUrl}/stalls/${this.editForm.id}/images/${filename}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            stall_no: stallNo,
            branch_id: branchId,
            filename: filename
          })
        })

        if (response.ok) {
          // Remove image from local array
          this.stallImages.splice(index, 1)
          
          // Adjust current index if needed
          if (this.currentImageIndex >= this.stallImages.length) {
            this.currentImageIndex = Math.max(0, this.stallImages.length - 1)
          }
          
          console.log(`✅ Image ${filename} deleted successfully`)
          this.$emit('image-deleted', { filename, stallNo })
        } else {
          const result = await response.json().catch(() => ({ message: 'Failed to delete image' }))
          console.error('Failed to delete image:', result.message)
          this.$emit('error', `Failed to delete image: ${result.message}`)
        }
      } catch (error) {
        console.error('Error deleting image:', error)
        this.$emit('error', `Error deleting image: ${error.message}`)
      }
    },

    confirmDeleteImage(index) {
      if (confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
        this.deleteStallImage(this.stallImages[index], index)
      }
    },

    handleImageUpload(event) {
      const file = event.target.files?.[0] || event
      if (!file) return

      console.log('Processing image file:', file.name, file.size, file.type)

      if (file.size > 5000000) {
        console.error('Image size too large')
        return
      }

      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        console.error('Invalid image type')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        this.imagePreview = e.target.result
        console.log('Image preview set')
      }
      reader.onerror = () => {
        console.error('Failed to read image file')
      }
      reader.readAsDataURL(file)
      this.selectedImageFile = file
    },

    removeImage() {
      this.selectedImageFile = null
      this.imagePreview = null
      this.editForm.image = null
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ''
      console.log('Image removed')
    },

    async processImageFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          console.log('Image file processed successfully')
          resolve(e.target.result)
        }
        reader.onerror = () => {
          console.error('Failed to process image file')
          reject(new Error('Failed to read image file'))
        }
        reader.readAsDataURL(file)
      })
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
    },

    handleDelete() {
      this.showDeleteConfirm = true
    },

    cancelDelete() {
      this.showDeleteConfirm = false
    },

    getFloorOptions() {
      return ['1st Floor', '2nd Floor', '3rd Floor']
    },

    getSectionOptions() {
      return [
        'Grocery Section',
        'Meat Section',
        'Fresh Produce',
        'Clothing Section',
        'Electronics Section',
        'Food Court',
        'General Section',
      ]
    },

    getPriceTypeOptions() {
      return ['Fixed Price', 'Auction', 'Raffle']
    },

    formatPriceInput(event) {
      let value = event.target.value
      value = value.replace(/[^0-9.]/g, '')

      const parts = value.split('.')
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('')
      }

      this.editForm.price = value
    },
  },

  beforeDestroy() {
    if (this.popupTimeout) {
      clearTimeout(this.popupTimeout)
    }
  },
}

// backend - create routes or endpoint
//services

// client
//services - fetch(), insert

// api - useUser() call fetch user in service ()

// component - useUser()

//component - fetch in backend

// endpoint /api/User
// vue or react //api/user