import AddAvailableStall from '../../AddAvailableStall/AddAvailableStall.vue'
import AddFloorSection from '../../AddFloorSection/AddFloorSection.vue'
import ViewFloorsSections from '../ViewFloorsSection/ViewFloorsSections.vue'

export default {
  name: 'AddChoiceModal',
  components: {
    AddAvailableStall,
    AddFloorSection,
    ViewFloorsSections,
  },
  props: {
    showModal: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      showAddStallModal: false,
      showAddFloorSectionModal: false,
      showViewFloorsSectionsModal: false,
    }
  },
  methods: {
    // Handle Floating Action Button click with smart logic
    async handleFabClick() {
      console.log('🎯 FAB clicked in AddChoiceModal - checking floors and sections availability')
      
      // Get current user info
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')
      const userType = sessionStorage.getItem('userType')
      
      console.log('🎯 Current user type:', userType || currentUser.userType)
      
      // Check if floors and sections are available
      const hasFloorsSections = await this.checkFloorsAndSections()
      console.log('🎯 Has floors and sections:', hasFloorsSections)

      if (!hasFloorsSections) {
        console.log('🎯 No floors/sections - showing warning container')
        // If no floors/sections, show a warning container with primary color
        this.$emit('show-warning-container', {
          title: 'Setup Required',
          message: 'Please set up floors and sections first before adding stalls.',
          type: 'primary'
        })
        console.log('🎯 Warning container emitted')
      } else {
        console.log('🎯 Floors/sections exist - emitting open-modal event')
        // If floors/sections exist, show the choice modal
        this.$emit('open-modal')
        console.log('🎯 Event emitted: open-modal')
      }
    },

    // Check if floors and sections are available
    async checkFloorsAndSections() {
      try {
        const token = sessionStorage.getItem('authToken')
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const apiBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`

        console.log('🔍 Checking floors and sections...')
        console.log('🔍 Current user:', currentUser)
        console.log('🔍 Branch ID:', currentUser.branch_id)
        console.log('🔍 API Base URL:', apiBaseUrl)
        console.log('🔍 Auth Token:', token ? 'Present' : 'Missing')

        // First, let's check if the user has any existing stalls
        // This is a more direct indicator than checking floors/sections separately
        console.log('🔍 Checking existing stalls from:', `${apiBaseUrl}/stalls`)
        const stallsResponse = await fetch(`${apiBaseUrl}/stalls`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        console.log('🔍 Stalls response status:', stallsResponse.status)

        if (stallsResponse.ok) {
          const stallsData = await stallsResponse.json()
          console.log('🔍 Stalls data:', stallsData)
          
          // If user has existing stalls, they definitely have floors and sections
          if (stallsData && stallsData.success && stallsData.data && stallsData.data.length > 0) {
            console.log('🔍 ✅ User has existing stalls - skipping setup popup')
            return true
          }
        }

        // If no stalls or error checking stalls, fall back to checking floors and sections
        console.log('🔍 No existing stalls found, checking floors and sections separately...')

        // Check for floors (with cache busting)
        const floorsUrl = `${apiBaseUrl}/branches/floors?t=${Date.now()}`
        console.log('🔍 Fetching floors from:', floorsUrl)
        const floorsResponse = await fetch(floorsUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        // Check for sections (with cache busting)
        const sectionsUrl = `${apiBaseUrl}/branches/sections?t=${Date.now()}`
        console.log('🔍 Fetching sections from:', sectionsUrl)
        const sectionsResponse = await fetch(sectionsUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        console.log('🔍 Floors response status:', floorsResponse.status)
        console.log('🔍 Sections response status:', sectionsResponse.status)

        if (!floorsResponse.ok || !sectionsResponse.ok) {
          console.error('❌ Error checking floors/sections:', floorsResponse.status, sectionsResponse.status)
          
          // Let's see the error responses
          if (!floorsResponse.ok) {
            const floorsError = await floorsResponse.text()
            console.error('❌ Floors error response:', floorsError)
          }
          if (!sectionsResponse.ok) {
            const sectionsError = await sectionsResponse.text()
            console.error('❌ Sections error response:', sectionsError)
          }
          
          // If we can't check, assume no floors/sections to be safe
          return false
        }

        const floorsData = await floorsResponse.json()
        const sectionsData = await sectionsResponse.json()

        console.log('🔍 Floors data:', floorsData)
        console.log('🔍 Sections data:', sectionsData)

        // Check the data structure more carefully
        let hasFloors = false
        let hasSections = false

        if (floorsData && floorsData.success) {
          hasFloors = floorsData.data && Array.isArray(floorsData.data) && floorsData.data.length > 0
        } else if (floorsData && Array.isArray(floorsData)) {
          hasFloors = floorsData.length > 0
        }

        if (sectionsData && sectionsData.success) {
          hasSections = sectionsData.data && Array.isArray(sectionsData.data) && sectionsData.data.length > 0
        } else if (sectionsData && Array.isArray(sectionsData)) {
          hasSections = sectionsData.length > 0
        }

        console.log('🔍 Floors/Sections check result:', { 
          hasFloors, 
          hasSections, 
          floorsCount: hasFloors ? (floorsData.data?.length || floorsData.length || 0) : 0,
          sectionsCount: hasSections ? (sectionsData.data?.length || sectionsData.length || 0) : 0,
          finalResult: hasFloors && hasSections,
          floorsDataStructure: typeof floorsData,
          sectionsDataStructure: typeof sectionsData
        })
        
        return hasFloors && hasSections
      } catch (error) {
        console.error('❌ Error checking floors and sections:', error)
        // If there's an error, assume no floors/sections to be safe
        return false
      }
    },

    // Close the choice modal
    closeModal() {
      this.$emit('close-modal')
    },

    // Handle selection of Add Stall
    selectAddStall() {
      this.closeModal()
      this.showAddStallModal = true
    },

    // Handle selection of Add Floor & Section
    selectAddFloorSection() {
      this.closeModal()
      this.showAddFloorSectionModal = true
    },

    // Handle selection of View Floors & Sections
    selectViewFloorsSections() {
      this.closeModal()
      this.showViewFloorsSectionsModal = true
    },

    // Close Add Stall Modal
    closeAddStallModal() {
      this.showAddStallModal = false
    },

    // Close Add Floor & Section Modal
    closeAddFloorSectionModal() {
      this.showAddFloorSectionModal = false
    },

    // Close View Floors & Sections Modal
    closeViewFloorsSectionsModal() {
      this.showViewFloorsSectionsModal = false
    },

    // Handle stall added event
    handleStallAdded(stallData) {
      this.$emit('stall-added', stallData)
    },

    // Handle floor added event
    handleFloorAdded(floorData) {
      console.log('🏢 Floor added in AddChoiceModal:', floorData)
      this.$emit('floor-added', floorData)
      
      // Add a small delay to ensure database has been updated, then re-check availability
      setTimeout(async () => {
        console.log('🔄 Re-checking floors/sections availability after floor addition...')
        // Force a fresh check by clearing any potential caches
        await this.checkFloorsAndSections()
      }, 500)
    },

    // Handle section added event
    handleSectionAdded(sectionData) {
      console.log('🏗️ Section added in AddChoiceModal:', sectionData)
      this.$emit('section-added', sectionData)
      
      // Add a small delay to ensure database has been updated, then re-check availability
      setTimeout(async () => {
        console.log('🔄 Re-checking floors/sections availability after section addition...')
        // Force a fresh check by clearing any potential caches
        await this.checkFloorsAndSections()
      }, 500)
    },

    // Handle show message event
    handleShowMessage(messageData) {
      this.$emit('show-message', messageData)
    },

    // Handle refresh stalls event
    handleRefreshStalls() {
      this.$emit('refresh-stalls')
    },

    // Handle refresh data event (for floors/sections)
    handleRefreshData() {
      this.$emit('refresh-data')
    },

    // Handle opening Add Floor Section from View modal
    handleOpenAddFloorSection() {
      this.showViewFloorsSectionsModal = false
      this.showAddFloorSectionModal = true
    },
  },
}
