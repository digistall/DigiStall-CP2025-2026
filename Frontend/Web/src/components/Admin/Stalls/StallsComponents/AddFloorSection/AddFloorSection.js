import { eventBus, EVENTS } from '../../../../../eventBus.js'

export default {
  name: 'AddFloorSection',
  props: {
    showModal: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      activeTab: 'floor',
      floorFormValid: false,
      sectionFormValid: false,
      loading: false,
      newFloor: {
        floorNumber: '',
        floorName: '',
        status: 'Active',
      },

      // Section data
      newSection: {
        floorId: null,
        sectionName: '',
        status: 'Active',
      },

      // Form validation rules
      rules: {
        required: (value) => !!value || 'Required field',
        floorNumber: (value) => {
          if (!value) return 'Required field'
          return /^[0-9A-Za-z]{1,3}$/.test(value) || 'Must be 1-3 characters (letters/numbers)'
        },
      },

      // Options for dropdowns
      floorOptions: [],
      statusOptions: [
        { value: 'Active', title: 'Active' },
        { value: 'Inactive', title: 'Inactive' },
        { value: 'Maintenance', title: 'Under Maintenance' },
        { value: 'Closed', title: 'Closed' },
      ],
      // API base URL
      apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',

      // Success snackbar state
      showSuccessSnackbar: false,
      successMessage: '',
      
      // Error snackbar state
      showErrorSnackbar: false,
      errorMessage: '',
    }
  },

  watch: {
    showModal(newVal) {
      if (newVal) {
        this.loadFloors()
        this.resetForms()
      }
    },
  },

  methods: {
    // Load floors for section dropdown (silent loading)
    async loadFloors() {
      try {
        const token = sessionStorage.getItem('authToken')
        // Use only the correct endpoint for floors
        const endpoint = `${this.apiBaseUrl}/branches/floors`
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          this.floorOptions = []
          return
        }
        const result = await response.json()
        // Support both array and object response
        const floors = Array.isArray(result) ? result : result.data || []
        this.floorOptions = Array.isArray(floors)
          ? floors.map((floor) => ({
              value: floor.floor_id,
              title: `${floor.floor_name} (${floor.floor_number})`,
            }))
          : []
      } catch (error) {
        console.error('Error loading floors:', error)
        this.floorOptions = []
      }
    },

    // Submit floor form
    async submitFloor() {
      if (!this.floorFormValid) return

      this.loading = true

      try {
        const token = sessionStorage.getItem('authToken')
        // Use only the correct endpoint for floors
        const endpoint = `${this.apiBaseUrl}/branches/floors`
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            floor_number: this.newFloor.floorNumber,
            floor_name: this.newFloor.floorName,
            status: this.newFloor.status,
          }),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }
        const result = await response.json()

        // Show success snackbar notification
        this.successMessage = `Floor "${this.newFloor.floorName}" added successfully!`
        this.showSuccessSnackbar = true

        this.resetFloorForm()
        await this.loadFloors()
        this.$emit('floor-added', result)
        this.$emit('refresh-data')
        
        // Emit global event for real-time updates
        eventBus.emit(EVENTS.FLOOR_ADDED, {
          floorData: result,
          message: `Floor "${this.newFloor.floorName}" added successfully!`
        })
        eventBus.emit(EVENTS.FLOORS_SECTIONS_UPDATED, {
          type: 'floor',
          action: 'added',
          data: result
        })
      } catch (error) {
        console.error('Error adding floor:', error)
        // Show error snackbar notification
        this.errorMessage = error.message || 'Failed to add floor. Please try again.'
        this.showErrorSnackbar = true
      } finally {
        this.loading = false
      }
    },

    // Submit section form
    async submitSection() {
      if (!this.sectionFormValid) return
      this.loading = true
      try {
        const token = sessionStorage.getItem('authToken')
        // Use only the correct endpoint for sections
        const endpoint = `${this.apiBaseUrl}/branches/sections`
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            floor_id: this.newSection.floorId,
            section_name: this.newSection.sectionName,
            status: this.newSection.status,
          }),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }
        const result = await response.json()

        // Show success snackbar notification
        this.successMessage = `Section "${this.newSection.sectionName}" added successfully!`
        this.showSuccessSnackbar = true

        this.resetSectionForm()
        this.$emit('section-added', result)
        this.$emit('refresh-data')
        
        // Emit global event for real-time updates
        eventBus.emit(EVENTS.SECTION_ADDED, {
          sectionData: result,
          message: `Section "${this.newSection.sectionName}" added successfully!`
        })
        eventBus.emit(EVENTS.FLOORS_SECTIONS_UPDATED, {
          type: 'section',
          action: 'added',
          data: result
        })
      } catch (error) {
        console.error('Error adding section:', error)
        // Show error snackbar notification
        this.errorMessage = error.message || 'Failed to add section. Please try again.'
        this.showErrorSnackbar = true
      } finally {
        this.loading = false
      }
    },

    // Reset forms
    resetForms() {
      this.resetFloorForm()
      this.resetSectionForm()
      this.activeTab = 'floor'
    },

    resetFloorForm() {
      this.newFloor = {
        floorNumber: '',
        floorName: '',
        status: 'Active',
      }
      this.floorFormValid = false
      if (this.$refs.floorForm) {
        this.$refs.floorForm.resetValidation()
      }
    },

    resetSectionForm() {
      this.newSection = {
        floorId: null,
        sectionName: '',
        status: 'Active',
      }
      this.sectionFormValid = false
      if (this.$refs.sectionForm) {
        this.$refs.sectionForm.resetValidation()
      }
    },

    // Modal controls
    closeModal() {
      this.$emit('close-modal')
      this.resetForms()
    },
  },
}
