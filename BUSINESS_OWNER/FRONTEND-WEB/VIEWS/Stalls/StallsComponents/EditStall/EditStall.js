import DeleteStall from '../DeleteStall/DeleteStall.vue'
import { eventBus, EVENTS } from '@/eventBus.js'

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
      selectedImageFiles: [], // NEW: Support multiple image files
      imagePreview: null,
      imagePreviews: [], // NEW: Support multiple previews
      showDeleteConfirm: false,
      showImageDeleteDialog: false, // NEW: Image delete confirmation modal
      floors: [], // Dynamically loaded floors
      sections: [], // Dynamically loaded sections
      imageToDelete: null, // NEW: Track which image to delete
      valid: false,
      loading: false,
      uploadingImages: false, // NEW: Track image upload state
      deletingImage: false, // NEW: Track image deletion state
      calculatedMonthlyRent: '', // Auto-calculated NEW RATE FOR 2013 = RENTAL RATE (2010) × 2
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
        areaSqm: [
          // Optional - but if provided must be valid positive number
          (v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) > 0) || 'Area must be a positive number',
        ],
        baseRate: [
          // Optional - but if provided must be valid positive number
          (v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) > 0) || 'Monthly rent must be a positive number',
        ],
        location: [(v) => !!v || 'Location is required'],
        description: [
          (v) => !!v || 'Description is required',
          (v) => (v && v.length >= 10) || 'Description must be at least 10 characters',
        ],
      },
      imageRules: [
        // NO SIZE LIMIT - LONGBLOB supports up to 4GB
        // Handle both single file and array of files from multiple input
        // Accept by MIME type OR file extension
        (v) => {
          if (!v) return true
          const files = Array.isArray(v) ? v : [v]
          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
          const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
          
          const invalidFiles = files.filter(f => {
            if (!f || !f.name) return false
            const ext = f.name.toLowerCase().substring(f.name.lastIndexOf('.'))
            const isValidType = f.type && (allowedTypes.includes(f.type) || f.type.startsWith('image/'))
            const isValidExt = allowedExtensions.includes(ext)
            return !isValidType && !isValidExt
          })
          
          if (invalidFiles.length > 0) {
            return `Invalid files: ${invalidFiles.map(f => f.name).join(', ')}`
          }
          return true
        },
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
    // NEW: Check how many more images can be uploaded (max 10)
    remainingImageSlots() {
      return Math.max(0, 10 - this.stallImages.length)
    },
  },
  watch: {
    stallData: {
      async handler(newData, oldData) {
        console.log('👀 stallData watcher triggered')
        console.log('New data:', newData)
        console.log('Old data:', oldData)

        if (newData && Object.keys(newData).length) {
          console.log('📝 Populating form with new data')
          // Ensure floors/sections are loaded before populating form
          if (this.floors.length === 0 || this.sections.length === 0) {
            console.log('⏳ Floors/sections not loaded yet, fetching...')
            await this.fetchFloorsAndSections()
          }
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
        areaSqm: '', // Area in square meters (NEW)
        baseRate: '', // Base rate from MASTERLIST (NEW)
        location: '',
        description: '',
        image: null,
        isAvailable: true,
        priceType: 'Fixed Price',
      }
    },

    // Calculate rental price from RENTAL RATE (2010)
    // Formula from MASTERLIST:
    // NEW RATE FOR 2013 = RENTAL RATE (2010) × 2
    // DISCOUNTED = NEW RATE FOR 2013 × 0.75 (25% off for early payment)
    calculateRentalPrice() {
      const rentalRate2010 = parseFloat(this.editForm.baseRate)
      if (rentalRate2010 && rentalRate2010 > 0) {
        // NEW RATE FOR 2013 = RENTAL RATE (2010) × 2
        const monthlyRent = Math.round(rentalRate2010 * 2 * 100) / 100
        this.calculatedMonthlyRent = monthlyRent.toFixed(2)
        this.editForm.price = monthlyRent.toString()
        console.log(`📊 RENTAL RATE 2010: ${rentalRate2010} | Monthly Rent (×2): ${monthlyRent}`)
      } else {
        this.calculatedMonthlyRent = ''
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

      // Get base rate: either from database, or calculate from existing price (price = baseRate × 2)
      const existingPrice = this.extractNumericPrice(data.rental_price || data.price) || 0
      const baseRateFromDb = data.base_rate || data.baseRate
      // If no base_rate in DB, existing price IS the monthly rent, so base rate = price / 2
      const calculatedBaseRate = baseRateFromDb || (existingPrice ? (existingPrice / 2).toFixed(2) : '')

      // Look up floor/section names from IDs if not provided directly
      const floorId = data.floor_id || data.floorId
      const sectionId = data.section_id || data.sectionId
      let floorName = data.floor_name || data.floor || ''
      let sectionName = data.section_name || data.section || ''
      
      console.log('🔍 Looking up floor/section:', { floorId, sectionId, floorName, sectionName })
      console.log('📚 Available floors:', this.floors)
      console.log('📚 Available sections:', this.sections)
      
      // If we have IDs but no names, look up from our fetched arrays
      if (floorId && !floorName && this.floors.length > 0) {
        const floor = this.floors.find(f => f.floor_id === floorId)
        if (floor) {
          floorName = floor.floor_name
          console.log('✅ Found floor name:', floorName)
        } else {
          console.warn('⚠️ Floor not found for ID:', floorId)
        }
      }
      if (sectionId && !sectionName && this.sections.length > 0) {
        const section = this.sections.find(s => s.section_id === sectionId)
        if (section) {
          sectionName = section.section_name
          console.log('✅ Found section name:', sectionName)
        } else {
          console.warn('⚠️ Section not found for ID:', sectionId)
        }
      }

      this.editForm = {
        id: extractedId,
        stallNumber: data.stall_number || data.stall_no || data.stallNumber || '',
        price: existingPrice || '',
        floor: floorName,
        floorId: floorId || null,
        section: sectionName,
        sectionId: sectionId || null,
        areaSqm: data.area_sqm || data.areaSqm || this.extractAreaFromSize(data.size) || '', // NEW
        baseRate: calculatedBaseRate, // RENTAL RATE (2010) - either from DB or price/2
        location: data.stall_location || data.location || '',
        description: data.description || '',
        image: data.stall_image || data.image || null,
        isAvailable: data.status === 'Active' || data.isAvailable === true,
        priceType: data.price_type || data.priceType || 'Fixed Price',
      }

      // Auto-calculate monthly rent display
      if (this.editForm.baseRate) {
        this.calculatedMonthlyRent = (parseFloat(this.editForm.baseRate) * 2).toFixed(2)
      } else {
        this.calculatedMonthlyRent = ''
      }

      // Don't set imagePreview from existing image - only set it for newly uploaded images
      // This allows the gallery to show instead of the upload preview
      this.imagePreview = null
      this.selectedImageFile = null
      console.log('Form populated:', this.editForm)
    },

    // Extract area from old size format (e.g., "17.16 sq.m" -> 17.16)
    extractAreaFromSize(size) {
      if (!size) return ''
      // Try to extract number from size string (e.g., "17.16 sq.m" or "3x2m")
      const sqmMatch = String(size).match(/^([\d.]+)\s*sq\.?m?$/i)
      if (sqmMatch) return sqmMatch[1]
      return ''
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

        // Optional fields (new stalls should have these, but existing ones may not)
        // areaSqm and baseRate are optional for backward compatibility

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

        // Validate area (must be positive number)
        if (this.editForm.areaSqm && (isNaN(parseFloat(this.editForm.areaSqm)) || parseFloat(this.editForm.areaSqm) <= 0)) {
          console.error('Invalid area format')
          return
        }

        // Image upload is now handled separately via BLOB API after stall update
        // No size limit - images are uploaded to BLOB storage
        let imageData = this.editForm.image

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
          size: this.editForm.areaSqm ? `${this.editForm.areaSqm} sq.m` : null, // Format area as size
          area_sqm: parseFloat(this.editForm.areaSqm) || null, // NEW: Area in square meters
          base_rate: parseFloat(this.editForm.baseRate) || null, // NEW: Base rate
          location: this.editForm.location,
          description: this.editForm.description.trim(),
          image: imageData,
          isAvailable: this.editForm.isAvailable,
          priceType: this.editForm.priceType,
        }

        console.log('📊 editForm before save:', {
          floor: this.editForm.floor,
          floorId: this.editForm.floorId,
          section: this.editForm.section,
          sectionId: this.editForm.sectionId
        })

        // Calculate rate per sq.m if area is provided
        if (updateData.area_sqm > 0 && updateData.price > 0) {
          updateData.rate_per_sqm = Math.round((updateData.price / updateData.area_sqm) * 100) / 100
          console.log(`📊 Rate per Sq.m: ${updateData.price} / ${updateData.area_sqm} = ${updateData.rate_per_sqm}`)
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

          // NEW: Upload pending images to BLOB storage
          if (this.selectedImageFiles.length > 0) {
            await this.uploadImagesToBlob(this.editForm.id)
          }

          // Refresh images from BLOB storage
          await this.fetchStallImagesFromBlob({ stall_id: this.editForm.id })

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

          // Clear pending images after successful upload
          this.selectedImageFiles = []
          this.imagePreviews = []
          this.selectedImageFile = null
          this.imagePreview = null

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
      this.selectedImageFiles = []
      this.imagePreview = null
      this.imagePreviews = []
      this.uploadingImages = false
      this.deletingImage = false
      this.showDeleteConfirm = false
      this.showImageDeleteDialog = false
      this.imageToDelete = null
      this.stallImages = []
      this.currentImageIndex = 0
      if (this.$refs.editForm) this.$refs.editForm.resetValidation()
    },

    // Multi-image gallery methods
    async fetchStallImagesFromBlob(stallData) {
      const stallId = stallData.stall_id || stallData.id
      
      if (!stallId) {
        console.log('No stall ID available for image fetching')
        return
      }

      console.log(`🖼️ Fetching images for stall ${stallId} from BLOB storage...`)
      this.loadingImages = true
      this.stallImages = []

      try {
        const token = sessionStorage.getItem('authToken')
        // Remove trailing /api if present to get base URL
        const apiUrl = this.apiBaseUrl.replace(/\/api$/, '')
        
        console.log('🔗 API Base URL:', this.apiBaseUrl)
        console.log('🔗 Base URL (no /api):', apiUrl)
        
        // Use BLOB API endpoint to get images
        const fetchUrl = `${apiUrl}/api/stalls/${stallId}/images/blob`
        console.log('🔗 Fetching from:', fetchUrl)
        
        const response = await fetch(fetchUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data.images && result.data.images.length > 0) {
            // Map images to use BLOB serving endpoint
            this.stallImages = result.data.images.map(img => {
              const imageUrl = `${apiUrl}/api/stalls/images/blob/id/${img.image_id}`
              console.log(`🖼️ Image ${img.image_id} URL:`, imageUrl)
              return {
                id: img.image_id,
                url: imageUrl,
                is_primary: img.is_primary,
                display_order: img.display_order,
                file_name: img.file_name
              }
            })
            console.log(`📸 Found ${this.stallImages.length} images in BLOB storage`)
          } else {
            console.log('📸 No images found in BLOB storage')
            // Fallback to database image URL
            if (stallData.stall_image || stallData.image) {
              this.stallImages = [{ 
                id: 'legacy', 
                url: stallData.stall_image || stallData.image,
                is_primary: true 
              }]
            }
          }
        } else {
          console.error('Failed to fetch images from BLOB API:', response.status)
          // Fallback to database image
          if (stallData.stall_image || stallData.image) {
            this.stallImages = [{ 
              id: 'legacy', 
              url: stallData.stall_image || stallData.image,
              is_primary: true 
            }]
          }
        }
      } catch (error) {
        console.error('Error fetching stall images:', error)
        // Fallback to database image
        if (stallData.stall_image || stallData.image) {
          this.stallImages = [{ 
            id: 'legacy', 
            url: stallData.stall_image || stallData.image,
            is_primary: true 
          }]
        }
      } finally {
        this.loadingImages = false
        this.currentImageIndex = 0
      }
    },

    // Legacy method - kept for compatibility but redirects to BLOB
    async fetchStallImagesFromHtdocs(stallData) {
      // Redirect to BLOB storage method
      return this.fetchStallImagesFromBlob(stallData)
    },

    // NEW: Upload pending images to BLOB storage
    async uploadImagesToBlob(stallId) {
      if (!stallId || this.selectedImageFiles.length === 0) {
        console.log('No images to upload or no stall ID')
        return
      }

      console.log(`📤 Uploading ${this.selectedImageFiles.length} images to BLOB storage...`)
      this.uploadingImages = true

      const token = sessionStorage.getItem('authToken')
      const apiUrl = this.apiBaseUrl.replace('/api', '')

      try {
        // Upload images one by one
        for (let i = 0; i < this.selectedImageFiles.length; i++) {
          const file = this.selectedImageFiles[i]
          const preview = this.imagePreviews[i]
          
          console.log(`📸 Uploading image ${i + 1}/${this.selectedImageFiles.length}: ${file.name}`)

          const uploadData = {
            stall_id: stallId,
            image_data: preview.dataUrl, // Base64 data URL
            mime_type: file.type,
            file_name: file.name,
            is_primary: i === 0 && this.stallImages.length === 0 // First image becomes primary if no existing images
          }

          const response = await fetch(`${apiUrl}/api/stalls/images/blob/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(uploadData)
          })

          const result = await response.json()

          if (response.ok && result.success) {
            console.log(`✅ Image ${i + 1} uploaded successfully:`, result.data)
          } else {
            console.error(`❌ Failed to upload image ${i + 1}:`, result.message)
            throw new Error(result.message || `Failed to upload image ${file.name}`)
          }
        }

        console.log(`✅ All ${this.selectedImageFiles.length} images uploaded successfully!`)
        
      } catch (error) {
        console.error('Error uploading images to BLOB:', error)
        this.$emit('error', `⚠️ Image upload error: ${error.message}`)
      } finally {
        this.uploadingImages = false
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
        const currentImg = this.stallImages[this.currentImageIndex]
        // Handle both object format (BLOB) and string format (legacy)
        const url = typeof currentImg === 'object' ? currentImg.url : currentImg
        console.log('🖼️ getCurrentImage() returning:', url)
        return url
      }
      return this.editForm.image || null
    },

    handleMainImageError(event) {
      const currentImg = this.stallImages[this.currentImageIndex]
      const url = typeof currentImg === 'object' ? currentImg.url : currentImg
      console.error('❌ Image failed to load:', url)
      console.error('❌ Current image data:', currentImg)
    },

    confirmDeleteImage(index) {
      // Store the image to delete and show modal
      this.imageToDelete = { index, data: this.stallImages[index] }
      this.showImageDeleteDialog = true
    },

    cancelDeleteImage() {
      this.showImageDeleteDialog = false
      this.imageToDelete = null
    },

    async deleteStallImage() {
      if (!this.imageToDelete) return

      const { index, data: imageData } = this.imageToDelete
      
      // Handle both object format (BLOB) and string format (legacy)
      const imageId = typeof imageData === 'object' ? imageData.id : null
      const imageUrl = typeof imageData === 'object' ? imageData.url : imageData
      
      console.log(`🗑️ Deleting image at index ${index}`, imageId ? `ID: ${imageId}` : `URL: ${imageUrl}`)

      this.deletingImage = true

      try {
        const token = sessionStorage.getItem('authToken')
        const apiUrl = this.apiBaseUrl.replace('/api', '')
        
        if (imageId && imageId !== 'legacy') {
          // Use BLOB API delete endpoint for BLOB images
          const response = await fetch(`${apiUrl}/api/stalls/images/blob/${imageId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          const result = await response.json().catch(() => ({ success: false, message: 'Failed to parse response' }))

          if (response.ok && result.success) {
            // Remove image from local array
            this.stallImages.splice(index, 1)
            
            // Adjust current index if needed
            if (this.currentImageIndex >= this.stallImages.length) {
              this.currentImageIndex = Math.max(0, this.stallImages.length - 1)
            }
            
            console.log(`✅ Image deleted successfully via BLOB API`)
            this.$emit('success', '🗑️ Image deleted successfully!')
            this.$emit('image-deleted', { imageId })
            
            // Close modal
            this.showImageDeleteDialog = false
            this.imageToDelete = null
          } else {
            console.error('Failed to delete image:', result.message)
            this.$emit('error', `❌ Failed to delete image: ${result.message}`)
          }
        } else if (imageId === 'legacy') {
          // Delete legacy image from stall table
          const stallId = this.editForm.id
          const response = await fetch(`${apiUrl}/api/stalls/${stallId}/legacy-image`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          const result = await response.json().catch(() => ({ success: false, message: 'Failed to parse response' }))

          if (response.ok && result.success) {
            // Remove image from local array
            this.stallImages.splice(index, 1)
            
            // Adjust current index if needed
            if (this.currentImageIndex >= this.stallImages.length) {
              this.currentImageIndex = Math.max(0, this.stallImages.length - 1)
            }
            
            console.log(`✅ Legacy image deleted successfully`)
            this.$emit('success', '🗑️ Legacy image deleted successfully!')
            this.$emit('image-deleted', { stallId, legacy: true })
            
            // Close modal
            this.showImageDeleteDialog = false
            this.imageToDelete = null
          } else {
            console.error('Failed to delete legacy image:', result.message)
            this.$emit('error', `❌ Failed to delete legacy image: ${result.message}`)
          }
        } else {
          console.warn('Unknown image format - cannot delete')
          this.$emit('error', '⚠️ Unknown image format. Cannot delete.')
        }
      } catch (error) {
        console.error('Error deleting image:', error)
        this.$emit('error', `❌ Error deleting image: ${error.message}`)
      } finally {
        this.deletingImage = false
      }
    },

    handleImageUpload(event) {
      const files = event.target.files || event
      if (!files || files.length === 0) return

      // Check remaining slots
      const remainingSlots = this.remainingImageSlots - this.selectedImageFiles.length
      if (remainingSlots <= 0) {
        this.$emit('error', `⚠️ Maximum 10 images per stall. Current: ${this.stallImages.length}/10`)
        return
      }

      // Process each file (up to remaining slots)
      const filesToProcess = Array.from(files).slice(0, remainingSlots)
      
      console.log(`📸 Processing ${filesToProcess.length} image files...`)

      filesToProcess.forEach((file, index) => {
        console.log(`Processing image ${index + 1}:`, file.name, this.formatFileSize(file.size), file.type)

        // Validate file type - accept common image types and also check file extension
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
        const isValidType = allowedTypes.includes(file.type) || file.type.startsWith('image/')
        const isValidExt = allowedExtensions.includes(fileExt)
        
        if (!isValidType && !isValidExt) {
          console.error(`Invalid image for ${file.name}: type=${file.type}, ext=${fileExt}`)
          this.$emit('error', `⚠️ Skipped ${file.name} - not a valid image file`)
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          // Add to arrays
          this.selectedImageFiles.push(file)
          this.imagePreviews.push({
            name: file.name,
            size: file.size,
            type: file.type || `image/${fileExt.replace('.', '')}`,
            dataUrl: e.target.result
          })
          console.log(`✅ Image ${file.name} added. Total pending: ${this.selectedImageFiles.length}`)
          
          // For backward compatibility, also set single image preview
          if (this.selectedImageFiles.length === 1) {
            this.imagePreview = e.target.result
            this.selectedImageFile = file
          }
        }
        reader.onerror = () => {
          console.error(`Failed to read image file: ${file.name}`)
        }
        reader.readAsDataURL(file)
      })

      if (filesToProcess.length < files.length) {
        this.$emit('error', `⚠️ Only ${filesToProcess.length} of ${files.length} images added. Max 10 per stall.`)
      }
    },

    removeSelectedImage(index) {
      // Remove from pending uploads
      this.selectedImageFiles.splice(index, 1)
      this.imagePreviews.splice(index, 1)
      
      // Update single image compatibility
      if (this.selectedImageFiles.length === 0) {
        this.selectedImageFile = null
        this.imagePreview = null
      } else {
        this.selectedImageFile = this.selectedImageFiles[0]
        this.imagePreview = this.imagePreviews[0]?.dataUrl || null
      }
      
      console.log(`📸 Removed pending image. Remaining: ${this.selectedImageFiles.length}`)
    },

    removeImage() {
      this.selectedImageFile = null
      this.selectedImageFiles = []
      this.imagePreview = null
      this.imagePreviews = []
      this.editForm.image = null
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ''
      console.log('All pending images removed')
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
      // Return floors from API with value/title format for v-select
      return this.floors.map(f => ({
        title: f.floor_name,
        value: f.floor_name
      }))
    },

    getSectionOptions() {
      // Return sections filtered by selected floor
      const selectedFloor = this.floors.find(f => f.floor_name === this.editForm.floor)
      if (!selectedFloor) {
        return this.sections.map(s => ({
          title: s.section_name,
          value: s.section_name
        }))
      }
      return this.sections
        .filter(s => s.floor_id === selectedFloor.floor_id)
        .map(s => ({
          title: s.section_name,
          value: s.section_name
        }))
    },

    async fetchFloorsAndSections() {
      try {
        const token = sessionStorage.getItem('authToken')
        if (!token) return

        // Fetch floors
        const floorsResponse = await fetch(`${this.apiBaseUrl}/branches/floors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (floorsResponse.ok) {
          const floorsData = await floorsResponse.json()
          this.floors = floorsData.data || floorsData.floors || []
          console.log('✅ Loaded floors:', this.floors)
        }

        // Fetch all sections for all floors
        for (const floor of this.floors) {
          const sectionsResponse = await fetch(`${this.apiBaseUrl}/branches/floors/${floor.floor_id}/sections`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (sectionsResponse.ok) {
            const sectionsData = await sectionsResponse.json()
            const floorSections = (sectionsData.data || sectionsData.sections || []).map(s => ({
              ...s,
              floor_id: floor.floor_id
            }))
            this.sections = [...this.sections, ...floorSections]
          }
        }
        console.log('✅ Loaded sections:', this.sections)
      } catch (error) {
        console.error('❌ Error fetching floors/sections:', error)
      }
    },

    handleFloorChange(floorName) {
      // Update floorId when floor name changes
      const floor = this.floors.find(f => f.floor_name === floorName)
      this.editForm.floorId = floor ? floor.floor_id : null
      // Reset section when floor changes
      this.editForm.section = ''
      this.editForm.sectionId = null
    },

    handleSectionChange(sectionName) {
      // Update sectionId when section name changes
      const section = this.sections.find(s => s.section_name === sectionName)
      this.editForm.sectionId = section ? section.section_id : null
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

  async mounted() {
    // Fetch floors and sections when component mounts
    await this.fetchFloorsAndSections()
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