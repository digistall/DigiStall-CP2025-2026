import CardStallsComponent from '../Stalls/StallsComponents/CardStallsComponent/CardStallsComponent.vue'
import SearchFilter from '../Stalls/StallsComponents/SearchAndFilter/SearchAndFilter.vue'
import AddChoiceModal from './StallsComponents/ChoicesModal/AddChoiceModal/AddChoiceModal.vue'
import EditStall from '../Stalls/StallsComponents/EditStall/EditStall.vue'
import UniversalPopup from '../../Common/UniversalPopup/UniversalPopup.vue'
import { eventBus, EVENTS } from '../../../eventBus.js'
import dataCacheService from '../../../services/dataCacheService.js'

export default {
  name: 'Stalls',
  components: {
    CardStallsComponent,
    SearchFilter,
    AddChoiceModal,
    EditStall,
    UniversalPopup,
  },
  data() {
    return {
      pageTitle: 'Stalls',
      showModal: false,
      showEditModal: false,
      selectedStall: {},
      stallsData: [],
      displayStalls: [],
      loading: false,
      error: null,
      // API configuration
      apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
      // Current user info
      currentUser: null,
      // Floor/Section availability check
      hasFloorsSections: true,
      // Warning container dialog
      showWarningContainer: false,
      warningData: {
        title: '',
        message: '',
        type: 'primary'
      },
      // Custom popup for notifications
      popup: {
        show: false,
        message: '',
        type: 'error', // error, success, warning, info, loading
        operation: '', // add, update, delete
        operationType: 'stall', // stall, employee, stallholder, etc.
      },
      
      // Flag to track when we're in the middle of updating a stall
      isUpdatingStall: false,
    }
  },

  async mounted() {
    await this.initializeComponent()
    this.setupEventListeners()
  },

  beforeDestroy() {
    this.cleanupEventListeners()
  },

  methods: {
    // Setup event bus listeners
    setupEventListeners() {
      // Listen for floor and section updates
      eventBus.on(EVENTS.FLOOR_ADDED, this.handleFloorSectionUpdate)
      eventBus.on(EVENTS.SECTION_ADDED, this.handleFloorSectionUpdate)
      eventBus.on(EVENTS.FLOORS_SECTIONS_UPDATED, this.handleFloorSectionUpdate)
      
      // Listen for stall events for real-time updates
      eventBus.on(EVENTS.STALL_ADDED, this.handleEventBusStallAdded)
      eventBus.on(EVENTS.STALL_UPDATED, this.handleEventBusStallUpdated)
      eventBus.on(EVENTS.STALL_DELETED, this.handleEventBusStallDeleted)
    },

    // Cleanup event bus listeners
    cleanupEventListeners() {
      eventBus.off(EVENTS.FLOOR_ADDED, this.handleFloorSectionUpdate)
      eventBus.off(EVENTS.SECTION_ADDED, this.handleFloorSectionUpdate)
      eventBus.off(EVENTS.FLOORS_SECTIONS_UPDATED, this.handleFloorSectionUpdate)
      
      // Clean up stall event listeners
      eventBus.off(EVENTS.STALL_ADDED, this.handleEventBusStallAdded)
      eventBus.off(EVENTS.STALL_UPDATED, this.handleEventBusStallUpdated)
      eventBus.off(EVENTS.STALL_DELETED, this.handleEventBusStallDeleted)
    },

    // Handle floor/section updates from event bus
    async handleFloorSectionUpdate(data) {
      console.log('🔄 Event bus update received:', data)
      
      // Re-check floors and sections availability
      if (this.currentUser?.userType === 'branch_manager') {
        console.log('🔄 Re-checking floors and sections after event bus update...')
        this.hasFloorsSections = await this.checkFloorsAndSections()
        
        if (this.hasFloorsSections) {
          console.log('✅ Floors and sections are now available via event bus!')
        }
      }
    },

    // Handle stall added from event bus (real-time updates)
    async handleEventBusStallAdded(data) {
      try {
        console.log('🆕 EventBus: Stall added received:', data)
        
        if (data.stallData) {
          // Invalidate cache since stall was added
          dataCacheService.invalidatePattern('stalls');
          
          // Transform the new stall data and add to local array
          const transformedStall = this.transformStallData(data.stallData)
          console.log('🆕 EventBus: Transformed new stall:', transformedStall)
          
          // Add to beginning of array and clear any filters to show all stalls
          this.stallsData.unshift(transformedStall)
          
          // Clear filters to show the new stall
          if (this.$refs.searchFilter) {
            this.$refs.searchFilter.clearAllFilters()
          }
          
          // Update display
          this.displayStalls = [...this.stallsData]
          
          // Close modal if it's open
          this.closeAddStallModal()
          
          console.log('✅ EventBus: Stall added successfully via real-time update')
        }
      } catch (error) {
        console.error('❌ EventBus: Error handling stall added:', error)
      }
    },

    // Handle stall updated from event bus (real-time updates)
    async handleEventBusStallUpdated(data) {
      try {
        console.log('📝 EventBus: Stall updated received:', data)
        
        if (data.stallData) {
          // Use the existing handleStallUpdated method which already has the logic
          await this.handleStallUpdated(data.stallData)
          console.log('✅ EventBus: Stall updated successfully via real-time update')
        }
      } catch (error) {
        console.error('❌ EventBus: Error handling stall updated:', error)
      }
    },

    // Handle stall deleted from event bus (real-time updates)
    async handleEventBusStallDeleted(data) {
      try {
        console.log('🗑️ EventBus: Stall deleted received:', data)
        
        if (data.stallId) {
          // Use the existing handleStallDeleted method which already has the logic
          await this.handleStallDeleted(data.stallId)
          console.log('✅ EventBus: Stall deleted successfully via real-time update')
        }
      } catch (error) {
        console.error('❌ EventBus: Error handling stall deleted:', error)
      }
    },

    // Initialize component with user auth check
    async initializeComponent() {
      try {
        // Check authentication first
        const token = sessionStorage.getItem('authToken')
        const user = sessionStorage.getItem('currentUser')

        if (!token || !user) {
          this.showMessage('Please login to access stalls', 'error')
          this.$router.push('/login')
          return
        }

        // Validate token format - JWT tokens have 3 parts separated by dots
        if (token && !this.isValidJWTFormat(token)) {
          console.warn('⚠️ Invalid token format detected - but continuing for debugging')
          console.warn('   - Token:', token)
          console.warn('   - Token length:', token?.length)
          console.warn('   - Expected JWT format with 3 parts separated by dots')
          // Temporarily allow non-JWT tokens for debugging
          // this.clearAuthAndRedirect()
          // this.showMessage('Session expired. Please login again.', 'warning')
          // return
        }

        // Check if user has permission to access stalls
        if (!this.checkStallsPermission()) {
          this.showMessage('Access denied. You do not have permission to view stalls.', 'error')
          this.$router.push('/dashboard')
          return
        }

        this.currentUser = JSON.parse(user)
        console.log('Current user type available:', !!this.currentUser?.userType)

        // Load stalls first - always allow viewing existing stalls
        await this.fetchStalls()

        // For branch managers, check floors and sections availability for adding new stalls
        // But don't block access to viewing existing stalls
        if (this.currentUser.userType === 'branch_manager') {
          this.hasFloorsSections = await this.checkFloorsAndSections()
          if (!this.hasFloorsSections) {
            console.log('⚠️ No floors/sections available - will show warning when trying to add stalls')
          }
        }
      } catch (error) {
        console.error('Error initializing component:', error)
        this.showMessage('Error initializing stalls page', 'error')
      }
    },

    // Fetch stalls from backend API with proper authentication and caching
    async fetchStalls(forceRefresh = false) {
      this.loading = true
      this.error = null

      try {
        console.log('Fetching stalls from:', `${this.apiBaseUrl}/stalls`)

        // Get token from sessionStorage (where login stores it)
        const token = sessionStorage.getItem('authToken')

        if (!token) {
          throw new Error('Authentication token not found. Please login again.')
        }

        // Validate token format before making API call
        if (!this.isValidJWTFormat(token)) {
          console.warn('⚠️ Invalid JWT token format detected in fetchStalls - but continuing for debugging')
        }

        // Use cache if available and not forcing refresh
        const cacheKey = 'stalls_data';
        if (!forceRefresh && dataCacheService.has(cacheKey)) {
          const cachedData = dataCacheService.get(cacheKey);
          if (cachedData && cachedData.success) {
            this.stallsData = cachedData.data || [];
            this.displayStalls = [...this.stallsData];
            this.loading = false;
            console.log('📦 Using cached stalls data');
            return;
          }
        }

        console.log('🔑 Making stalls API call with authentication')

        // Use cached fetch for API call
        const result = await dataCacheService.cachedFetch(`${this.apiBaseUrl}/stalls`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }, 5 * 60 * 1000); // Cache for 5 minutes

        console.log('API Response:', result)

        if (result.success) {
          // Transform backend data to match frontend format
          this.stallsData = result.data.map((stall) => this.transformStallData(stall))
          this.displayStalls = [...this.stallsData]

          console.log(`Successfully loaded ${this.stallsData.length} stalls for branch manager`)
          console.log('Transformed stalls data:', this.stallsData)
        } else {
          throw new Error(result.message || 'Failed to fetch stalls')
        }
      } catch (error) {
        console.error('Error fetching stalls:', error)
        this.error = error.message

        // Show error message
        this.showMessage(`Failed to load stalls: ${error.message}`, 'error')

        // Handle authentication errors
        if (error.message.includes('401') || error.message.includes('Session expired')) {
          this.clearAuthAndRedirect()
        } else if (error.message.includes('403')) {
          // Check permissions
          const userPermissions = JSON.parse(sessionStorage.getItem('employeePermissions') || '[]')
          if (!userPermissions.includes('stalls')) {
            this.showMessage('Access denied: You do not have permission to view stalls.', 'error')
          }
        }
      } finally {
        this.loading = false
      }
    },

    // Check if floors and sections are available for branch manager
    async checkFloorsAndSections() {
      try {
        const token = sessionStorage.getItem('authToken')
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const apiBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`

        console.log('Checking floors and sections availability...')

        // Check for floors
        const floorsResponse = await fetch(`${apiBaseUrl}/branches/floors`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        // Check for sections
        const sectionsResponse = await fetch(`${apiBaseUrl}/branches/sections`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!floorsResponse.ok || !sectionsResponse.ok) {
          console.error('Error checking floors/sections:', floorsResponse.status, sectionsResponse.status)
          return false
        }

        const floorsData = await floorsResponse.json()
        const sectionsData = await sectionsResponse.json()

        const hasFloors = floorsData.success && floorsData.data && floorsData.data.length > 0
        const hasSections = sectionsData.success && sectionsData.data && sectionsData.data.length > 0

        console.log('Floors/Sections check:', { hasFloors, hasSections })
        console.log('Floors data:', floorsData.data?.length || 0, 'items')
        console.log('Sections data:', sectionsData.data?.length || 0, 'items')

        return hasFloors && hasSections
      } catch (error) {
        console.error('Error checking floors and sections:', error)
        return false
      }
    },

    transformStallData(stall) {
      console.log('🔄 Transforming stall data:', stall)

      // FIXED: More robust ID extraction - prefer stall_id from backend, then id
      const extractedId = stall.stall_id || stall.id || stall.ID
      console.log('🔍 ID extraction debug:', {
        'stall.stall_id': stall.stall_id,
        'stall.id': stall.id,
        'stall.ID': stall.ID,
        'extractedId': extractedId,
        'extractedId type': typeof extractedId
      })

      if (!extractedId) {
        console.error('❌ No valid ID found in stall data:', stall)
        throw new Error('Stall data is missing required ID field')
      }

      const transformed = {
        // Basic stall info - ensure ID is consistent
        id: Number(extractedId),
        stallNumber: stall.stall_no || stall.stallNumber,
        price: this.formatPrice(stall.rental_price || stall.price),
        location: stall.stall_location,
        size: stall.size,
        dimensions: stall.size || stall.dimensions, // Use size as primary, dimensions as fallback
        description: stall.description,
        status: stall.status,
        stamp: stall.stamp,
        createdAt: stall.created_at,
        isAvailable: Boolean(stall.is_available),

        // ⭐ FIX: Add BOTH naming conventions for compatibility
        // Snake_case (for filter component)
        floor_id: stall.floor_id,
        floor_name: stall.floor_name,
        floor_number: stall.floor_number,
        section_id: stall.section_id,
        section_name: stall.section_name,

        // CamelCase (for other components)
        floorId: stall.floor_id,
        floorName: stall.floor_name,
        floorNumber: stall.floor_number,
        sectionId: stall.section_id,
        sectionName: stall.section_name,
        sectionCode: stall.section_name, // Use section_name as fallback since section_code doesn't exist

        // Legacy fields for backward compatibility
        floor: stall.floor_name || `Floor ${stall.floor_number}`,
        section: stall.section_name,
        priceType: stall.price_type || 'Fixed Price',
        price_type: stall.price_type || 'Fixed Price',

        // Image
        image: stall.stall_image || this.getDefaultImage(stall.section_name),

        // Manager info
        managerName:
          stall.manager_first_name && stall.manager_last_name
            ? `${stall.manager_first_name} ${stall.manager_last_name}`
            : 'Unknown Manager',
        area: stall.area,
        branchLocation: stall.location,

        // Keep original values
        rentalPrice: stall.rental_price,
        rental_price: stall.rental_price,
        originalData: stall,
      }

      console.log('🔄 Transformed stall ID:', transformed.id, 'type:', typeof transformed.id)
      return transformed
    },

    // Format price display
    formatPrice(price) {
      return `₱${parseFloat(price).toLocaleString()}`
    },

    // Get default image based on section from database
    getDefaultImage(section) {
      const defaultImages = {
        // Match the sections from your database/form
        'Grocery Section': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'Meat Section': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
        'Fresh Produce': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
        'Clothing Section': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
        'Electronics Section': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
        'Food Court': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',

        // Default fallback
        default: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      }

      console.log(`Getting image for section: "${section}"`)
      return defaultImages[section] || defaultImages['default']
    },

    // Check if user has permission to access stalls
    checkStallsPermission() {
      const userType = sessionStorage.getItem('userType')

      // Admins and branch managers always have access (check both formats)
      if (userType === 'admin' || userType === 'branch-manager' || userType === 'branch_manager') {
        return true
      }

      // For employees, check specific permissions - NEW FORMAT (object)
      if (userType === 'employee') {
        // Try new format first (object with permissions)
        const permissions = JSON.parse(sessionStorage.getItem('permissions') || '{}')
        if (permissions.stalls === true) {
          return true
        }

        // Fallback to old format (array)
        const employeePermissions = JSON.parse(
          sessionStorage.getItem('employeePermissions') || '[]',
        )
        return employeePermissions.includes('stalls') || employeePermissions.stalls === true
      }

      return false
    },

    // Clear authentication and redirect to login
    clearAuthAndRedirect() {
      // Clear all authentication data - COMPREHENSIVE CLEANUP
      sessionStorage.removeItem('authToken')
      sessionStorage.removeItem('currentUser')
      sessionStorage.removeItem('userType')
      sessionStorage.removeItem('branchManagerId')
      sessionStorage.removeItem('employeeId')
      sessionStorage.removeItem('employeeData')
      sessionStorage.removeItem('employeePermissions')
      sessionStorage.removeItem('permissions')
      sessionStorage.removeItem('userRole')
      sessionStorage.removeItem('branchId')
      sessionStorage.removeItem('fullName')
      sessionStorage.removeItem('adminId')
      sessionStorage.removeItem('adminData')

      console.log('🧹 Session cleared due to authentication error')

      setTimeout(() => {
        this.$router.push('/login')
      }, 2000)
    },

    // Validate JWT token format (should have 3 parts separated by dots)
    isValidJWTFormat(token) {
      if (!token || typeof token !== 'string') return false

      const parts = token.split('.')
      return parts.length === 3 && parts.every((part) => part.length > 0)
    },

    // Refresh stalls data
    async refreshStalls() {
      await this.fetchStalls()
    },

    // Edit stall functions
    handleStallEdit(stall) {
      console.log('🔧 Opening edit modal for stall:', stall)
      console.log('🔧 Stall ID in object:', stall.id)

      this.selectedStall = { ...stall }
      console.log('🔧 Selected stall set to:', this.selectedStall)

      this.showEditModal = true
    },

    async handleStallUpdated(updatedStallData) {
      try {
        console.log('📝 Handling stall update:', updatedStallData)
        
        // Set flag to prevent filter interference
        this.isUpdatingStall = true
        
        // Find and update the stall in stallsData
        const stallIndex = this.stallsData.findIndex(stall => 
          Number(stall.stall_id) === Number(updatedStallData.stall_id) ||
          Number(stall.id) === Number(updatedStallData.stall_id)
        )
        
        if (stallIndex !== -1) {
          // Transform the updated data to match our format
          const transformedStall = this.transformStallData(updatedStallData)
          
          // Update stallsData
          this.stallsData.splice(stallIndex, 1, transformedStall)
          
          // Clear all filters to show all stalls including the updated one
          if (this.$refs.searchFilter) {
            this.$refs.searchFilter.clearAllFilters()
          }
          
          // Show all stalls after clearing filters
          this.displayStalls = [...this.stallsData]
          
          // Invalidate cache since stall was updated
          dataCacheService.invalidatePattern('stalls');
          
          console.log('✅ Stall updated successfully - using real-time updates')
        } else {
          console.warn('⚠️ Stall not found for update')
        }
      } catch (error) {
        console.error('❌ Error updating stall:', error)
      } finally {
        // Always clear the flag after update
        this.isUpdatingStall = false
      }
    },

    closeEditModal() {
      this.showEditModal = false
      this.selectedStall = {}
    },

    async handleStallDeleted(stallId) {
      try {
        console.log('Processing stall deletion for ID:', stallId)

        // Invalidate cache since stall was deleted
        dataCacheService.invalidatePattern('stalls');

        // Remove from local data
        const index = this.stallsData.findIndex((s) => s.id === stallId)
        if (index > -1) {
          const deletedStall = this.stallsData[index]
          this.stallsData.splice(index, 1)
          this.displayStalls = [...this.stallsData]

          console.log(`Stall "${deletedStall.stallNumber}" removed from local data`)
        } else {
          console.warn('Stall not found in local data for deletion')
        }
      } catch (error) {
        console.error('Error handling stall deletion:', error)
        this.showMessage('Error removing stall from display', 'error', 'delete', 'stall')
      }
    },

    // Search and filter functions
    handleFilteredStalls(filtered) {
      // Ignore filter updates while we're updating a stall to prevent the updated stall from disappearing
      if (this.isUpdatingStall) {
        console.log('🔄 Ignoring filter update during stall update')
        return
      }
      
      this.displayStalls = filtered
    },

    // Handle Floating Action Button click
    async handleFabClick() {
      console.log('🎯 FAB clicked - checking floors and sections availability')
      console.log('🎯 Current user type:', this.currentUser?.userType)
      
      // For branch managers, always re-check floors and sections in real-time
      if (this.currentUser?.userType === 'branch_manager') {
        console.log('🔄 Re-checking floors and sections availability in real-time...')
        this.hasFloorsSections = await this.checkFloorsAndSections()
        console.log('🎯 Real-time check - Has floors and sections:', this.hasFloorsSections)
        
        if (!this.hasFloorsSections) {
          console.log('🎯 No floors/sections - showing warning message')
          this.showMessage('Please set up floors and sections first before adding stalls.', 'primary')
          return
        }
      }
      
      console.log('🎯 Floors/sections exist - showing choice modal')
      this.showModal = true
    },

    // Add stall functions
    async openAddStallModal() {
      // For branch managers, check if floors and sections are available before allowing stall creation
      if (this.currentUser?.userType === 'branch_manager') {
        console.log('🔄 Checking floors and sections availability before opening stall modal...')
        this.hasFloorsSections = await this.checkFloorsAndSections()
        
        if (!this.hasFloorsSections) {
          this.showMessage('Please set up floors and sections first before adding stalls.', 'primary')
          return
        }
      }
      this.showModal = true
    },

    closeAddStallModal() {
      this.showModal = false
    },

    // UPDATED: Handle stall added - DISABLED to prevent duplicates (using eventBus now)
    async handleStallAdded() {
      // This method is now disabled to prevent duplicate additions
      // Real-time updates are handled via eventBus in handleEventBusStallAdded
      console.log('⚠️ handleStallAdded called but ignoring - using eventBus instead')
      console.log('🔄 EventBus should handle this via handleEventBusStallAdded')
      return
    },

    // Alternative handler method name - DISABLED (using eventBus now)
    async onStallAdded() {
      // Also disabled to prevent duplicates
      console.log('⚠️ onStallAdded called but ignoring - using eventBus instead')
      return
    },

    // Handle floor added
    async handleFloorAdded(newFloorData) {
      try {
        console.log('Handling new floor data:', newFloorData)
        
        // Re-check floors and sections availability after adding a floor
        if (this.currentUser.userType === 'branch_manager') {
          console.log('🔄 Re-checking floors and sections availability after floor addition...')
          this.hasFloorsSections = await this.checkFloorsAndSections()
          
          if (this.hasFloorsSections) {
            console.log('✅ Floors and sections are now available!')
            this.showMessage('Floor added successfully! You can now add stalls.', 'success', 'add', 'floor')
          } else {
            console.log('⚠️ Still missing floors or sections')
            this.showMessage('Floor added successfully!', 'success', 'add', 'floor')
          }
        }
      } catch (error) {
        console.error('Error handling new floor:', error)
        this.showMessage('Error processing new floor', 'error', 'add', 'floor')
      }
    },

    // Handle section added
    async handleSectionAdded(newSectionData) {
      try {
        console.log('Handling new section data:', newSectionData)
        
        // Re-check floors and sections availability after adding a section
        if (this.currentUser.userType === 'branch_manager') {
          console.log('🔄 Re-checking floors and sections availability after section addition...')
          this.hasFloorsSections = await this.checkFloorsAndSections()
          
          if (this.hasFloorsSections) {
            console.log('✅ Floors and sections are now available!')
            this.showMessage('Section added successfully! You can now add stalls.', 'success', 'add', 'section')
          } else {
            console.log('⚠️ Still missing floors or sections')
            this.showMessage('Section added successfully!', 'success', 'add', 'section')
          }
        }
      } catch (error) {
        console.error('Error handling new section:', error)
        this.showMessage('Error processing new section', 'error', 'add', 'section')
      }
    },

    // Handle refresh request from child components
    async onRefreshStalls() {
      await this.fetchStalls()
    },

    // Handle refresh data request (floors/sections) from child components
    async handleRefreshData() {
      try {
        console.log('🔄 Handling refresh data request - re-checking floors and sections...')
        
        // Re-check floors and sections availability
        if (this.currentUser.userType === 'branch_manager') {
          this.hasFloorsSections = await this.checkFloorsAndSections()
          
          if (this.hasFloorsSections) {
            console.log('✅ Floors and sections are now available!')
          } else {
            console.log('⚠️ Still missing floors or sections')
          }
        }
      } catch (error) {
        console.error('Error handling refresh data:', error)
      }
    },

    // Message handling with enhanced display options
    showMessage(text, color = 'success', operation = '', operationType = 'stall') {
      // Handle case where an object is passed instead of string
      const messageText = typeof text === 'string' ? text : JSON.stringify(text)

      // Map old color values to new popup types
      const typeMapping = {
        success: 'success',
        error: 'error',
        warning: 'warning',
        info: 'info',
        primary: 'info',
        red: 'error',
        green: 'success',
        orange: 'warning',
        blue: 'info',
      }

      this.popup = {
        show: true,
        message: messageText,
        type: typeMapping[color] || 'error',
        operation: operation,
        operationType: operationType,
      }

      console.log(`Message (${color}): ${messageText}`)
    },

    // Modal event handlers
    handleEditModalClose() {
      this.closeEditModal()
    },

    handleEditError(errorMessage) {
      this.showMessage(errorMessage, 'error')
    },

    // Handle show-message events from child components
    handleShowMessage({ type, text, operation = '', operationType = 'stall' }) {
      this.showMessage(text, type, operation, operationType)
    },

    // Handle warning container request from AddChoiceModal
    handleShowWarningContainer(warningInfo) {
      console.log('🚨 Showing warning container:', warningInfo)
      this.warningData = {
        title: warningInfo.title || 'Information',
        message: warningInfo.message || '',
        type: warningInfo.type || 'primary'
      }
      this.showWarningContainer = true
    },

    // Close warning container and show choice modal
    closeWarningAndShowModal() {
      this.showWarningContainer = false
      // After closing warning, show the choice modal so user can add floors/sections
      this.showModal = true
    },

    // Debug helper - log current stall data
    debugStallData() {
      console.log('=== STALL DATA DEBUG ===')
      console.log('Total stalls:', this.stallsData.length)
      console.log('Display stalls:', this.displayStalls.length)
      console.log('Has sample stall:', this.stallsData.length > 0)
      console.log('Current user type:', this.currentUser?.userType)
      console.log('========================')
    },

    // NEW: Handle raffle management
    handleRaffleManagement(stall) {
      console.log('Navigate to raffle management for stall:', stall)
      // Navigate to the raffles page with a specific stall focus
      this.$router.push({
        path: '/stalls/raffles',
        query: { stallId: stall.id, stallNumber: stall.stallNumber },
      })
    },

    // NEW: Handle auction management
    handleAuctionManagement(stall) {
      console.log('Navigate to auction management for stall:', stall)
      // Navigate to the auctions page with a specific stall focus
      this.$router.push({
        path: '/stalls/auctions',
        query: { stallId: stall.id, stallNumber: stall.stallNumber },
      })
    },

    // Error handling utilities
    async retryFetch() {
      await this.fetchStalls()
    },

    handleNetworkError(error) {
      if (error.message.includes('fetch')) {
        return 'Network connection failed. Please check your internet connection.'
      } else if (error.message.includes('500')) {
        return 'Server error. Please try again later.'
      } else if (error.message.includes('404')) {
        return 'API endpoint not found. Please check server configuration.'
      }
      return 'An unexpected error occurred. Please try again.'
    },

    // Authentication utilities
    async makeAuthenticatedRequest(url, options = {}) {
      const token = sessionStorage.getItem('token')
      const defaultHeaders = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      }

      const requestOptions = {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      }

      try {
        const response = await fetch(url, requestOptions)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return await response.json()
      } catch (error) {
        console.error('API request failed:', error)
        throw error
      }
    },

    // Branch utilities
    getCurrentBranchInfo() {
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')
      return {
        branchId: currentUser.branchId || currentUser.branch_id,
        branchName: currentUser.branchName || currentUser.branch_name,
        userId: currentUser.id,
        userType: currentUser.userType,
      }
    },
  },

  // Computed properties
  computed: {
    hasStalls() {
      return this.stallsData && this.stallsData.length > 0
    },
  },

  // Watchers
  watch: {
    stallsData: {
      handler(newStalls) {
        // Update display stalls when main data changes
        if (this.displayStalls.length === 0 || this.displayStalls.length === newStalls.length) {
          this.displayStalls = [...newStalls]
        }

        // Debug log when stalls data changes
        console.log(`Stalls data updated: ${newStalls.length} stalls`)
      },
      deep: true,
    },

    displayStalls: {
      handler(newDisplayStalls) {
        console.log(`Display stalls updated: ${newDisplayStalls.length} stalls shown`)
      },
    },
  },

  // Lifecycle hooks
  beforeUnmount() {
    // Clear any timeouts or intervals if needed
    console.log('Stalls component unmounting')
  },

  // Error handling for component
  errorCaptured(err, instance, info) {
    console.error('Component error captured:', err, info)
    this.showMessage('A component error occurred. Please refresh the page.', 'error')
    return false
  },
}
