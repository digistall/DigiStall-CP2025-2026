import { eventBus, EVENTS } from '../../../../../eventBus.js'

export default {
  name: 'AddAvailableStall',
  props: {
    showModal: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      valid: false,
      newStall: {
        stallNumber: '',
        price: '',
        floorId: '',
        sectionId: '',
        areaSqm: '', // Changed from size to areaSqm (square meters like MASTERLIST)
        baseRate: '', // NEW: Base rate from MASTERLIST (RENTAL RATE 2010)
        location: '',
        description: '',
        images: [], // Changed from image to images array
        isAvailable: true,
        priceType: 'Fixed Price',
        applicationDeadline: '', // Will store calculated deadline when activated
        deadlineDays: 3, // Number of days after first application
        deadlineTime: '23:00', // Time of day for deadline (11:00 PM)
        deadlineActivated: false, // Whether the deadline timer has been activated
      },
      calculatedMonthlyRent: '', // NEW: Auto-calculated monthly rent
      imagePreviews: [], // Store image preview URLs
      priceTypeOptions: [
        {
          title: '🏷️ Fixed Price',
          value: 'Fixed Price',
          subtitle: 'Standard monthly rental',
        },
        {
          title: '🎯 Raffle',
          value: 'Raffle',
          subtitle: 'Random winner selection',
        },
        {
          title: '🏺 Auction',
          value: 'Auction',
          subtitle: 'Highest bidder wins',
        },
      ],
      rules: {
        required: (value) => !!value || 'Required field',
        number: (value) => !isNaN(parseFloat(value)) || 'Must be a valid number',
        positiveNumber: (value) => parseFloat(value) > 0 || 'Must be greater than 0',
        deadline: (value) => {
          if (!this.requiresDuration) return true // Skip validation if not raffle/auction
          // Validate days (1-30 days)
          const days = parseInt(value)
          if (!days || days < 1 || days > 30) {
            return 'Days must be between 1 and 30'
          }
          return true
        },
        deadlineTime: (value) => {
          if (!this.requiresDuration) return true
          if (!value) return 'Time is required for raffle/auction stalls'
          return true
        },
        imageCount: (value) => {
          if (!value || value.length === 0) return true // Images are optional
          return value.length <= 10 || 'Maximum 10 images allowed'
        },
        imageSize: (value) => {
          if (!value || value.length === 0) return true
          const oversized = value.filter(file => file.size > 10 * 1024 * 1024) // 10MB
          return oversized.length === 0 || 'Each image must be less than 10MB'
        },
      },
      // UPDATED: Dynamic options loaded from API
      floorOptions: [],
      sectionOptions: [],
      allSections: [], // Store all sections for filtering by floor
      loading: false,
      lastAddedStall: null, // Store the last added stall data for real-time updates
      // API base URL
      apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    }
  },

  methods: {
    // NEW METHOD: Load floors and sections from API
    async loadFloorsAndSections() {
      try {
        const token = sessionStorage.getItem('authToken')
        if (!token) {
          throw new Error('Authentication token not found')
        }

        // Load floors for current branch manager
        const floorsResponse = await fetch(`${this.apiBaseUrl}/branches/floors`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!floorsResponse.ok) {
          throw new Error(`Failed to load floors: ${floorsResponse.status}`)
        }

        const floorsResult = await floorsResponse.json()
        console.log('🔍 Backend floors response:', floorsResult)

        if (floorsResult.success) {
          this.floorOptions = floorsResult.data.map((floor) => ({
            title: floor.floor_name, // Just show "1st Floor", "2nd Floor", etc.
            value: floor.floor_id,
            floorData: floor,
          }))
          console.log('🔍 All floors loaded:', this.floorOptions)
        } else {
          console.error('API returned success: false for floors:', floorsResult)
          this.$emit(
            'show-message',
            `Failed to load floors: ${floorsResult.message || 'Unknown error'}`,
            'error',
          )
          this.floorOptions = []
        }

        // Load all sections for the current branch manager
        // TEMPORARY: Using debug endpoint to see what's returned
        const sectionsResponse = await fetch(`${this.apiBaseUrl}/branches/sections`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!sectionsResponse.ok) {
          throw new Error(`Failed to load sections: ${sectionsResponse.status}`)
        }

        const sectionsResult = await sectionsResponse.json()
        console.log('🔍 Backend sections response:', sectionsResult)
        console.log('🔍 JWT Token being sent:', token)
        console.log(
          '🔍 Decoded token payload:',
          token ? JSON.parse(atob(token.split('.')[1])) : 'No token',
        )
        console.log('🔍 API URL being called:', `${this.apiBaseUrl}/branches/sections`)

        if (sectionsResult.success) {
          this.allSections = sectionsResult.data
          console.log('🔍 All sections loaded:', this.allSections)
          console.log('🔍 First section sample:', this.allSections[0])

          // Initially show all sections (will be filtered when floor is selected)
          this.sectionOptions = this.allSections.map((section) => ({
            title: section.section_name, // FIXED: Remove section_code reference
            value: section.section_id,
            sectionData: section,
          }))
        } else {
          // If API returns success: false, show the error message
          console.error('API returned success: false for sections:', sectionsResult)
          this.$emit(
            'show-message',
            `Failed to load sections: ${sectionsResult.message || 'Unknown error'}`,
            'error',
          )
          // Clear the options instead of using static fallback
          this.floorOptions = []
          this.sectionOptions = []
        }
      } catch (error) {
        console.error('Error loading floors and sections:', error)
        this.$emit('show-message', {
          text: `Failed to load floors and sections: ${error.message}`,
          type: 'error',
        })

        // Clear the options instead of using static fallback data
        this.floorOptions = []
        this.sectionOptions = []
      }
    },

    // NEW METHOD: Filter sections by selected floor
    filterSectionsByFloor(floorId) {
      console.log(
        'Filtering sections by floor:',
        floorId,
        'Type of floorId:',
        typeof floorId,
        'Available sections:',
        this.allSections.length,
      )

      if (!floorId || !this.allSections.length) {
        // Show all sections if no floor selected or no sections available
        this.sectionOptions = this.allSections.map((section) => ({
          title: section.section_name, // FIXED: Remove section_code reference
          value: section.section_id,
          sectionData: section,
        }))
        console.log('Showing all sections:', this.sectionOptions.length)
        return
      }

      // Convert both to numbers for proper comparison
      const numericFloorId = parseInt(floorId)
      console.log('Converted floorId to:', numericFloorId)

      const filteredSections = this.allSections.filter((section) => {
        // Use floor_id from the updated schema
        const sectionFloorId = parseInt(section.floor_id)
        const matches = sectionFloorId === numericFloorId
        console.log(
          `Section ${section.section_name} (floor_id: ${section.floor_id}, floorId: ${section.floorId}) => parsed: ${sectionFloorId}, matches: ${matches}`,
        )
        return matches
      })

      console.log('Filtered sections:', filteredSections.length, 'for floor:', numericFloorId)

      this.sectionOptions = filteredSections.map((section) => ({
        title: section.section_name, // FIXED: Remove section_code reference
        value: section.section_id,
        sectionData: section,
      }))

      console.log('Final section options:', this.sectionOptions)
    },

    closeModal() {
      this.$emit('close-modal')
      this.resetForm()
    },

    // Image handling methods
    handleImageSelection(files) {
      console.log('📸 handleImageSelection called with:', files)
      console.log('  - Type:', typeof files)
      console.log('  - Is Array:', Array.isArray(files))
      console.log('  - Length:', files?.length || 0)
      
      // Clear previous previews
      this.imagePreviews.forEach(preview => {
        if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview)
        }
      })
      this.imagePreviews = []
      
      // Handle null/undefined/empty
      if (!files || (Array.isArray(files) && files.length === 0)) {
        console.log('  ❌ No files to process')
        return
      }
      
      // Convert to array if needed (some events pass FileList)
      const filesArray = Array.isArray(files) ? files : Array.from(files)
      console.log('  ✅ Files array created with', filesArray.length, 'files')
      
      // Generate previews using object URLs (faster than base64)
      const maxImages = Math.min(filesArray.length, 10)
      for (let i = 0; i < maxImages; i++) {
        const file = filesArray[i]
        if (file && file instanceof File) {
          const preview = URL.createObjectURL(file)
          this.imagePreviews.push(preview)
          console.log(`  ✅ Preview ${i + 1} created:`, file.name, `(${(file.size / 1024).toFixed(2)} KB)`)
        } else {
          console.warn(`  ⚠️ Item ${i} is not a valid File object:`, file)
        }
      }
      
      console.log('📸 Total previews generated:', this.imagePreviews.length)
      console.log('📸 Preview URLs:', this.imagePreviews)
    },

    getImagePreview(file) {
      return URL.createObjectURL(file)
    },

    removeImage(index) {
      console.log('🗑️ Removing image at index:', index)
      if (this.newStall.images && Array.isArray(this.newStall.images)) {
        // Revoke the object URL to free memory
        if (this.imagePreviews[index]?.startsWith('blob:')) {
          URL.revokeObjectURL(this.imagePreviews[index])
        }
        
        // Remove from both arrays
        this.newStall.images.splice(index, 1)
        this.imagePreviews.splice(index, 1)
        
        console.log('  ✅ Removed. Remaining images:', this.newStall.images.length)
      }
    },

    resetForm() {
      // Clean up image preview URLs
      this.imagePreviews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview)
        }
      })
      
      this.newStall = {
        stallNumber: '',
        price: '',
        floorId: '',
        sectionId: '',
        areaSqm: '', // Changed from size to areaSqm
        baseRate: '', // Base rate for auto-calculation
        location: '',
        description: '',
        images: [],
        isAvailable: true,
        priceType: 'Fixed Price',
        applicationDeadline: '', // Will store calculated deadline when activated
        deadlineDays: 3, // Number of days after first application
        deadlineTime: '23:00', // Time of day for deadline (11:00 PM)
        deadlineActivated: false, // Whether the deadline timer has been activated
      }
      this.calculatedMonthlyRent = '' // Reset calculated rent
      this.imagePreviews = [] // Clear image previews
      if (this.$refs.form) {
        this.$refs.form.resetValidation()
      }
    },

    async convertImageToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    },

    async submitForm() {
      // Validate form first
      if (!this.$refs.form.validate()) {
        this.$emit('show-message', {
          type: 'error',
          text: 'Please fill in all required fields correctly.',
        })
        return
      }

      this.loading = true

      try {
        // FIXED: Use the correct field names and include floor_id for new schema
        // UPDATED: Changed size to areaSqm and added baseRate for auto-calculation
        const stallData = {
          stallNumber: this.newStall.stallNumber, // Backend expects 'stallNumber'
          price: parseFloat(this.newStall.price), // Backend expects 'price' (monthly rent)
          location: this.newStall.location, // Backend expects 'location'
          size: this.newStall.areaSqm ? `${this.newStall.areaSqm} sq.m` : '', // Format as "17.16 sq.m"
          areaSqm: parseFloat(this.newStall.areaSqm) || 0, // NEW: Area in square meters
          baseRate: parseFloat(this.newStall.baseRate) || 0, // NEW: Base rate (RENTAL RATE 2010)
          floorId: this.newStall.floorId, // FIXED: Send floorId for new schema
          sectionId: this.newStall.sectionId, // FIXED: Send sectionId instead of section
          description: this.newStall.description,
          isAvailable: this.newStall.isAvailable,
          priceType: this.newStall.priceType,
        }

        // Calculate rate per sq.m if area is provided
        if (stallData.areaSqm > 0 && stallData.price > 0) {
          stallData.ratePerSqm = Math.round((stallData.price / stallData.areaSqm) * 100) / 100
          console.log(`📊 Rate per Sq.m: ${stallData.price} / ${stallData.areaSqm} = ${stallData.ratePerSqm}`)
        }

        // FIXED: Calculate deadline datetime for raffle/auction stalls
        if (this.requiresDuration) {
          // Calculate the actual deadline datetime
          const now = new Date()
          const deadlineDate = new Date(now)
          deadlineDate.setDate(deadlineDate.getDate() + parseInt(this.newStall.deadlineDays))

          // Set the time
          const [hours, minutes] = this.newStall.deadlineTime.split(':')
          deadlineDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

          // Send as ISO string (what backend expects)
          stallData.deadline = deadlineDate.toISOString()
          stallData.applicationDeadline = deadlineDate.toISOString() // Alternative field name

          console.log('Calculated deadline:', {
            days: this.newStall.deadlineDays,
            time: this.newStall.deadlineTime,
            calculatedDeadline: deadlineDate.toISOString(),
          })
        }

        console.log('Sending stall data to backend:', stallData)

        // Get auth token from sessionStorage
        const token = sessionStorage.getItem('authToken')

        if (!token) {
          this.$emit('show-message', {
            type: 'error',
            text: 'Authentication token not found. Please login again.',
          })
          this.$router.push('/login')
          return
        }

        // Create FormData for multipart upload
        const formData = new FormData()
        
        // Append stall data fields
        Object.keys(stallData).forEach(key => {
          formData.append(key, stallData[key])
        })

        // Append images if any
        if (this.newStall.images && this.newStall.images.length > 0) {
          console.log('📸 Appending images to FormData:', this.newStall.images.length)
          this.newStall.images.forEach((file, index) => {
            formData.append('images', file)
            console.log(`  Image ${index + 1}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
          })
        }

        console.log('Making API request to:', `${this.apiBaseUrl}/stalls`)

        // Make API call to backend with FormData
        const response = await fetch(`${this.apiBaseUrl}/stalls`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - let browser set it with boundary for multipart
          },
          body: formData,
        })

        console.log('Response status:', response.status)

        const result = await response.json()
        console.log('Backend response:', result)
        console.log('Backend response data:', result.data)

        if (!response.ok) {
          if (response.status === 401) {
            this.$emit('show-message', {
              type: 'error',
              text: 'Session expired. Please login again.',
            })
            this.$router.push('/login')
            return
          } else if (response.status === 400) {
            throw new Error(result.message || 'Bad request - check required fields')
          } else if (response.status === 403) {
            throw new Error('Access denied - branch manager authentication required')
          }
          throw new Error(result.message || `HTTP error! status: ${response.status}`)
        }

        if (result.success) {
          // Store the stall data for later use - use backend data first
          this.lastAddedStall = result.data || stallData

          console.log('✅ Stall added successfully!')
          console.log('📦 Stall data from backend:', this.lastAddedStall)
          console.log('🏢 Floor name:', this.lastAddedStall.floor_name)
          console.log('🏪 Section name:', this.lastAddedStall.section_name)

          // Emit local event for parent component
          this.$emit('stall-added', this.lastAddedStall)

          // Emit global event for real-time sidebar update
          eventBus.emit(EVENTS.STALL_ADDED, {
            stallData: this.lastAddedStall,
            priceType: this.lastAddedStall?.priceType || this.lastAddedStall?.price_type,
            message: result.message || 'Stall added successfully!',
          })

          // Close the modal
          this.closeModal()
        } else {
          throw new Error(result.message || 'Failed to add stall')
        }
      } catch (error) {
        console.error('Error adding stall:', error)
        this.handleSubmissionError(error)
      } finally {
        this.loading = false
      }
    },

    // Handle file input change
    handleImageUpload(file) {
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.$emit('show-message', {
          type: 'error',
          text: 'Please select a valid image file.',
        })
        return
      }

      // Validate file size (limit to 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        this.$emit('show-message', {
          type: 'error',
          text: 'Image file must be less than 5MB.',
        })
        return
      }

      this.newStall.image = file
    },

    // Validate price input
    validatePrice() {
      const price = parseFloat(this.newStall.price)
      if (isNaN(price) || price <= 0) {
        return 'Price must be a positive number'
      }
      return true
    },

    // Format stall number preview
    formatStallNumber(value) {
      if (!value) return ''
      return value.startsWith('STALL-') ? value : value
    },

    // Debug helper - check current auth state
    checkAuthState() {
      const token = sessionStorage.getItem('authToken')
      const user = sessionStorage.getItem('currentUser')

      console.log('Auth state check:', {
        tokenExists: !!token,
        tokenLength: token ? token.length : 0,
        userExists: !!user,
        currentUser: user ? JSON.parse(user) : null,
      })
    },

    // Validate stall number format
    validateStallNumber(value) {
      if (!value) return 'Stall number is required'
      if (value.length < 1) return 'Stall number must not be empty'
      return true
    },

    // Validate area in square meters (no longer dimension format)
    validateAreaSqm(value) {
      if (!value) return 'Area is required'
      const numValue = parseFloat(value)
      if (isNaN(numValue) || numValue <= 0) {
        return 'Area must be a positive number (e.g., 17.16)'
      }
      if (numValue > 1000) {
        return 'Area seems too large. Please verify the value.'
      }
      return true
    },

    // Calculate rental price from RENTAL RATE (2010)
    // Formula from MASTERLIST:
    // NEW RATE FOR 2013 = RENTAL RATE (2010) × 2
    // DISCOUNTED = NEW RATE FOR 2013 × 0.75 (25% off for early payment)
    calculateRentalPrice() {
      const rentalRate2010 = parseFloat(this.newStall.baseRate)
      if (rentalRate2010 && rentalRate2010 > 0) {
        // NEW RATE FOR 2013 = RENTAL RATE (2010) × 2
        const monthlyRent = Math.round(rentalRate2010 * 2 * 100) / 100
        // Discounted rate for early payment = Monthly Rent × 0.75
        const discountedRate = Math.round(monthlyRent * 0.75 * 100) / 100
        
        this.calculatedMonthlyRent = monthlyRent.toFixed(2)
        
        // Auto-update price field for Fixed Price type (use full monthly rent)
        if (this.newStall.priceType === 'Fixed Price') {
          this.newStall.price = monthlyRent.toString()
        }
        
        console.log(`📊 RENTAL RATE 2010: ${rentalRate2010} | Monthly Rent (×2): ${monthlyRent} | Discounted: ${discountedRate}`)
      } else {
        this.calculatedMonthlyRent = ''
        if (this.newStall.priceType === 'Fixed Price') {
          this.newStall.price = ''
        }
      }
    },

    // Calculate from area (optional - for rate per sq.m calculation)
    calculateRentalFromArea() {
      // Area change doesn't affect rental calculation directly
      // Rental is calculated from Base Rate × 1.5
      // Area is used for rate_per_sqm = Monthly Rent / Area
      console.log(`📐 Area updated: ${this.newStall.areaSqm} sq.m`)
    },

    // Validate location text
    validateLocation(value) {
      if (!value) return 'Location is required'
      if (value.length < 3) return 'Location must be at least 3 characters'
      if (value.length > 100) return 'Location must be less than 100 characters'
      return true
    },

    // Get current user info for debugging
    getCurrentUserInfo() {
      const user = sessionStorage.getItem('currentUser')
      return user ? JSON.parse(user) : null
    },

    // Handle form submission errors
    handleSubmissionError(error) {
      console.error('Form submission error:', error)

      let userMessage = 'An error occurred while adding the stall.'
      let autoRedirect = false

      if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = '❌ Network Error: Unable to connect to server. Please check your connection and try again.'
      } else if (error.message.includes('authentication') || error.message.includes('token')) {
        userMessage = '🔒 Session Expired: Please login again to continue.'
        autoRedirect = true
      } else if (error.message.includes('already exists')) {
        userMessage = `⚠️ Duplicate Stall: ${error.message}`
      } else if (error.message.includes('Access denied')) {
        userMessage = `🚫 Access Denied: ${error.message}`
      } else if (error.message.includes('Invalid section')) {
        userMessage = `⚠️ Invalid Section: ${error.message}`
      } else if (error.message.includes('Bad request')) {
        userMessage = `⚠️ Validation Error: ${error.message}`
      } else if (error.message) {
        userMessage = `❌ Error: ${error.message}`
      }

      this.$emit('show-message', {
        type: 'error',
        text: userMessage,
        operation: 'add',
        operationType: 'stall'
      })

      // Auto redirect to login if session expired
      if (autoRedirect) {
        setTimeout(() => {
          this.$router.push('/login')
        }, 3000)
      }
    },
  },

  computed: {
    stallNumberPreview() {
      return this.formatStallNumber(this.newStall.stallNumber)
    },

    formattedPrice() {
      const price = parseFloat(this.newStall.price)
      return isNaN(price) ? '' : `₱${price.toLocaleString()}`
    },

    // Check if all required fields are filled
    isFormValid() {
      const baseValidation =
        this.newStall.stallNumber &&
        this.newStall.price &&
        this.newStall.location &&
        this.newStall.areaSqm && // Changed from size to areaSqm
        this.newStall.baseRate && // Added baseRate check
        this.newStall.floorId &&
        this.newStall.sectionId

      // Additional validation for raffle/auction stalls
      if (this.requiresDuration) {
        const deadlineDaysValid =
          this.newStall.deadlineDays &&
          parseInt(this.newStall.deadlineDays) >= 1 &&
          parseInt(this.newStall.deadlineDays) <= 30
        const deadlineTimeValid =
          this.newStall.deadlineTime && this.newStall.deadlineTime.length > 0

        return baseValidation && deadlineDaysValid && deadlineTimeValid
      }

      return baseValidation
    },

    // Get formatted location for display (now just returns the text value)
    formattedLocation() {
      return this.newStall.location || ''
    },

    // Check if current user is authenticated
    isAuthenticated() {
      const token = sessionStorage.getItem('authToken')
      const user = sessionStorage.getItem('currentUser')
      return !!(token && user)
    },

    // ADDED: Get selected floor name for display
    selectedFloorName() {
      if (!this.newStall.floorId) return ''
      const selectedFloor = this.floorOptions.find((floor) => floor.value === this.newStall.floorId)
      return selectedFloor ? selectedFloor.title : ''
    },

    // ADDED: Get selected section name for display
    selectedSectionName() {
      if (!this.newStall.sectionId) return ''
      const selectedSection = this.sectionOptions.find(
        (section) => section.value === this.newStall.sectionId,
      )
      return selectedSection ? selectedSection.title : ''
    },

    // NEW: Check if duration field is required based on price type
    requiresDuration() {
      return this.newStall.priceType === 'Raffle' || this.newStall.priceType === 'Auction'
    },

    // NEW: Dynamic price field label based on price type
    priceFieldLabel() {
      switch (this.newStall.priceType) {
        case 'Raffle':
          return 'Entry Fee (₱)'
        case 'Auction':
          return 'Starting Bid (₱)'
        case 'Fixed Price':
        default:
          return 'Monthly Rent (₱)'
      }
    },

    // NEW: Deadline field hint text based on price type
    deadlineHint() {
      switch (this.newStall.price_type) {
        case 'Raffle':
          return 'When raffle applications will close'
        case 'Auction':
          return 'When auction applications will close'
        default:
          return ''
      }
    },

    // NEW: Dynamic validation rules for deadline field
    deadlineValidationRules() {
      if (!this.requiresDuration) {
        return [] // No validation needed for Fixed Price
      }
      return [this.rules.deadline, this.rules.deadlineTime]
    },
  },

  watch: {
    // ADDED: Watch for floor selection to filter sections
    'newStall.floorId'(newFloorId) {
      this.filterSectionsByFloor(newFloorId)
      // Reset section when floor changes
      this.newStall.sectionId = ''
    },

    // NEW: Watch for price type changes to debug
    'newStall.priceType'(newValue, oldValue) {
      console.log('Price type changed from', oldValue, 'to', newValue)
    },

    // Location is now a free text field, so no need for automatic price type setting
    // You can remove this watcher or modify it based on your needs
    'newStall.location'(newLocation) {
      // Optional: Set default price type based on location text
      if (
        newLocation.toLowerCase().includes('auction') ||
        newLocation.toLowerCase().includes('satellite')
      ) {
        this.newStall.priceType = 'Auction'
      } else {
        this.newStall.priceType = 'Fixed Price'
      }
    },

    // Watch for image file changes (deprecated - now using images array)
    'newStall.image'(newFile) {
      if (newFile) {
        console.log('Image file selected:', newFile.name, newFile.size)
      }
    },

    // Watch for images array changes
    'newStall.images': {
      handler(newImages) {
        console.log('🔄 Images watcher triggered, images count:', newImages?.length || 0)
        this.handleImageSelection(newImages)
      },
      deep: true
    },

    // Watch for form changes to debug (only in development)
    newStall: {
      handler(newVal) {
        // eslint-disable-next-line no-undef
        if (process.env.NODE_ENV === 'development') {
          console.log('Form data changed:', newVal)
        }
      },
      deep: true,
    },

    // Watch modal visibility - UPDATED with new logic
    showModal(newVal) {
      if (newVal) {
        // Modal opened - check auth state and load data
        if (!this.isAuthenticated) {
          console.warn('Modal opened but user not authenticated')
          this.$emit('show-message', {
            type: 'error',
            text: 'Please login to add stalls.',
          })
          this.$emit('close-modal')
        } else {
          // Load floors and sections when modal opens
          this.loadFloorsAndSections()
        }
      }
    },
  },

  mounted() {
    // Check authentication when component mounts
    this.checkAuthState()

    // Log current user info for debugging
    const userInfo = this.getCurrentUserInfo()
    if (userInfo) {
      console.log('Component mounted - Current user:', userInfo)
    } else {
      console.warn('Component mounted - No user authentication found')
    }

    // Debug price type options
    console.log('Price type options:', this.priceTypeOptions)
    console.log('Current price type:', this.newStall.priceType)

    // Load floors and sections if modal is already open
    if (this.showModal) {
      this.loadFloorsAndSections()
    }
  },

  beforeDestroy() {
    // Clean up timeouts when component is destroyed
    if (this.popupTimeout) {
      clearTimeout(this.popupTimeout)
      this.popupTimeout = null
    }
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
    
    // Clean up image preview URLs to prevent memory leaks
    this.imagePreviews.forEach(preview => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    })
  },

  // Error handling for the component
  errorCaptured(err, instance, info) {
    console.error('AddAvailableStall component error:', err, info)
    this.handleSubmissionError(err)
    return false // Prevent the error from propagating further
  },
}
