import TableCollector from './Components/Table/TableCollector.vue'
import LoadingOverlay from '../../Common/LoadingOverlay/LoadingOverlay.vue'

export default {
  name: 'Collectors',
  components: {
    TableCollector,
    LoadingOverlay,
  },
  data() {
    return {
      loading: false,
      addDialog: false,
      editDialog: false,
      detailsDialog: false,
      detailsData: null,
      credentialsDialog: false,
      formValid: false,
      editFormValid: false,

      // API configuration
      apiBaseUrl: (() => {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
      })(),

      collectors: [],

      // Validation rules
      rules: {
        required: (v) => !!v || 'This field is required',
        email: (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
        phone: (v) =>
          !v || /^09\d{9}$/.test(v) || 'Phone must be in format 09XXXXXXXXX (11 digits)',
      },

      newCollector: {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
      },

      editCollectorData: {
        id: null,
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
      },

      credentials: {
        username: '',
        password: '',
      },

      // Snackbar for notifications
      snackbar: {
        show: false,
        message: '',
        color: 'success',
        timeout: 3000,
      },
    }
  },
  computed: {
    filteredCollectors() {
      // Map collectors to match table format
      return this.collectors.map((c) => ({
        id: c.collector_id,
        name: `${c.first_name} ${c.last_name}`,
        contact: c.contact_no || 'N/A',
        location: c.branch_name || 'Unassigned',
        email: c.email,
        status: c.status,
        raw: c,
      }))
    },
  },
  mounted() {
    this.loadCollectors()
  },
  methods: {
    // Fetch collectors from API
    async loadCollectors() {
      this.loading = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`${this.apiBaseUrl}/mobile-staff/collectors`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch collectors: ${response.status}`)
        }

        const result = await response.json()

        if (result.success && result.data) {
          this.collectors = result.data
          console.log(`✅ Loaded ${this.collectors.length} collectors from database`)
        }
      } catch (error) {
        console.error('❌ Error loading collectors:', error)
        this.showNotification('Failed to load collectors: ' + error.message, 'error')
      } finally {
        this.loading = false
      }
    },

    openAddDialog() {
      this.addDialog = true
      // Reset form
      this.newCollector = {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
      }
    },

    async handleSave() {
      // Validate form
      const { valid } = await this.$refs.addForm.validate()
      if (!valid) return

      this.loading = true
      try {
        const token = localStorage.getItem('authToken')
        const branchId = JSON.parse(localStorage.getItem('user'))?.branchId || 1

        const response = await fetch(`${this.apiBaseUrl}/mobile-staff/collectors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: this.newCollector.firstName,
            lastName: this.newCollector.lastName,
            email: this.newCollector.email,
            phoneNumber: this.newCollector.phoneNumber,
            branchId: branchId,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to create collector: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Collector created:', result)

        // Show credentials in dialog
        if (result.data && result.data.credentials) {
          this.credentials.username = result.data.credentials.username
          this.credentials.password = result.data.credentials.password
          this.credentialsDialog = true
        }

        this.addDialog = false
        this.showNotification('Collector created successfully!', 'success')
        await this.loadCollectors()
      } catch (error) {
        console.error('❌ Error creating collector:', error)
        this.showNotification('Failed to create collector: ' + error.message, 'error')
      } finally {
        this.loading = false
      }
    },

    viewCollector(collector) {
      // Populate edit form with collector data
      this.editCollectorData = {
        id: collector.raw.collector_id,
        firstName: collector.raw.first_name,
        lastName: collector.raw.last_name,
        email: collector.raw.email,
        phoneNumber: collector.raw.contact_no || '',
      }
      this.editDialog = true
    },

    async handleEditSave() {
      // Validate form
      const { valid } = await this.$refs.editForm.validate()
      if (!valid) return

      this.loading = true
      try {
        const token = localStorage.getItem('authToken')

        const response = await fetch(
          `${this.apiBaseUrl}/mobile-staff/collectors/${this.editCollectorData.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              firstName: this.editCollectorData.firstName,
              lastName: this.editCollectorData.lastName,
              email: this.editCollectorData.email,
              phoneNumber: this.editCollectorData.phoneNumber,
            }),
          },
        )

        if (!response.ok) {
          throw new Error(`Failed to update collector: ${response.status}`)
        }

        console.log('✅ Collector updated successfully')

        this.editDialog = false
        this.showNotification('Collector updated successfully!', 'success')
        await this.loadCollectors()
      } catch (error) {
        console.error('❌ Error updating collector:', error)
        this.showNotification('Failed to update collector: ' + error.message, 'error')
      } finally {
        this.loading = false
      }
    },

    closeCredentialsDialog() {
      this.credentialsDialog = false
      this.credentials = { username: '', password: '' }
    },

    // Show notification helper
    showNotification(message, color = 'success') {
      this.snackbar.message = message
      this.snackbar.color = color
      this.snackbar.show = true
    },

    editCollector(collector) {
      console.log('Edit collector:', collector)
      // TODO: Implement edit functionality
    },
  },
}
