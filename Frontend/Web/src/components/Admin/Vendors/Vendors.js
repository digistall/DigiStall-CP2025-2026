import AddVendorDialog from './Components/AddVendorDialog/AddVendorDialog.vue'
import VendorDetailsDialog from './Components/VendorDetailsDialog/VendorDetailsDialog.vue'
import EditVendorDialog from './Components/EditVendorDialog/EditVendorDialog.vue'
import SearchVendor from './Components/Search/SearchVendor.vue'
import TableVendor from './Components/Table/TableVendor.vue'
import LoadingOverlay from '../../Common/LoadingOverlay/LoadingOverlay.vue'

export default {
  name: 'Vendors',
  components: {
    AddVendorDialog,
    VendorDetailsDialog,
    EditVendorDialog,
    SearchVendor,
    TableVendor,
    LoadingOverlay,
  },
  data() {
    return {
      loading: false,
      addDialog: false,
      detailsDialog: false,
      detailsData: null,
      editDialog: false,
      editData: null, // payload for the dialog (item.raw)
      editTargetId: null, // which row to update

      // API configuration
      apiBaseUrl: (() => {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
      })(),

      headers: [
        { title: 'Vendor ID', value: 'id', width: 120 },
        { title: "Vendor's Name", value: 'name' },
        { title: 'Business Name', value: 'business' },
        { title: 'Status', value: 'status', width: 120 },
        { title: 'Action', value: 'actions', sortable: false, align: 'end', width: 140 },
      ],
      collectors: [],
      statuses: ['Active', 'Inactive', 'On Hold'],

      vendors: [],

      search: '',
      statusFilter: 'all',

      // Snackbar for notifications
      snackbar: {
        show: false,
        message: '',
        color: 'success',
        timeout: 3000,
      },

      newVendor: {
        id: '',
        name: '',
        business: '',
        collector: 'John Smith',
        status: 'Active',
      },
    }
  },
  computed: {
    filteredVendors() {
      const term = (this.search || '').toLowerCase().trim()
      return this.vendors.filter((v) => {
        const hitsSearch =
          !term ||
          String(v.id).includes(term) ||
          v.name.toLowerCase().includes(term) ||
          v.business.toLowerCase().includes(term) ||
          v.collector.toLowerCase().includes(term) ||
          v.status.toLowerCase().includes(term)

        const hitsStatus = this.statusFilter === 'all' || v.status === this.statusFilter

        return hitsSearch && hitsStatus
      })
    },
  },
  mounted() {
    this.initializeVendors()
    this.loadCollectors()
  },
  methods: {
    // Fetch vendors from API
    async initializeVendors() {
      this.loading = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`${this.apiBaseUrl}/vendors`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch vendors: ${response.status}`)
        }

        const result = await response.json()

        if (result.success && result.data) {
          // Map database vendors to UI format
          this.vendors = result.data.map((vendor) => ({
            id: vendor.vendor_id,
            name: `${vendor.first_name} ${vendor.last_name}`,
            business: vendor.business_name || 'N/A',
            email: vendor.email || 'N/A',
            phone: vendor.phone || 'N/A',
            collector: vendor.collector_name || 'Unassigned',
            status: vendor.status,
            compliance: 'Compliant',
            raw: vendor,
          }))

          console.log(`✅ Loaded ${this.vendors.length} vendors from database`)
        }
      } catch (error) {
        console.error('❌ Error loading vendors:', error)
      } finally {
        this.loading = false
      }
    },

    // Fetch collectors from API
    async loadCollectors() {
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
          console.warn('Failed to fetch collectors')
          return
        }

        const result = await response.json()

        if (result.success && result.data) {
          this.collectors = result.data.map(
            (collector) => `${collector.first_name} ${collector.last_name}`,
          )
          console.log(`✅ Loaded ${this.collectors.length} collectors`)
        }
      } catch (error) {
        console.error('❌ Error loading collectors:', error)
      }
    },

    // open the two-page form
    openAddDialog() {
      this.addDialog = true
    },

    // receive new row and add to table
    async handleSave(newRow) {
      this.loading = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`${this.apiBaseUrl}/vendors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: newRow.firstName,
            lastName: newRow.lastName,
            middleName: newRow.middleName,
            phone: newRow.phone,
            email: newRow.email,
            birthdate: newRow.birthdate,
            gender: newRow.gender,
            address: newRow.address,
            businessName: newRow.businessName,
            businessType: newRow.businessType,
            businessDescription: newRow.productsSold,
            vendorIdentifier: newRow.vendorId,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to create vendor: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Vendor created:', result)

        this.showNotification('Vendor created successfully!', 'success')

        // Reload vendors list
        await this.initializeVendors()
      } catch (error) {
        console.error('❌ Error creating vendor:', error)
        this.showNotification('Failed to create vendor: ' + error.message, 'error')
      } finally {
        this.loading = false
      }
    },

    handleSearch(payload) {
      if (!payload) return
      this.search = payload.query || ''
      this.statusFilter = payload.filter || 'all'
    },

    view(row) {
      this.detailsData = row?.raw || row
      this.detailsDialog = true
    },

    edit(row) {
      this.editData = row?.raw || row
      this.editTargetId = row?.id
      this.editDialog = true
    },

    // called when Edit dialog submits
    async handleEditUpdate(updatedRow) {
      this.loading = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`${this.apiBaseUrl}/vendors/${this.editTargetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: updatedRow.firstName,
            lastName: updatedRow.lastName,
            middleName: updatedRow.middleName,
            phone: updatedRow.phone,
            email: updatedRow.email,
            birthdate: updatedRow.birthdate,
            gender: updatedRow.gender,
            address: updatedRow.address,
            businessName: updatedRow.businessName,
            businessType: updatedRow.businessType,
            businessDescription: updatedRow.productsSold,
            vendorIdentifier: updatedRow.vendorId,
            status: updatedRow.status || 'Active',
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update vendor: ${response.status}`)
        }

        console.log('✅ Vendor updated successfully')

        this.showNotification('Vendor updated successfully!', 'success')

        // Reload vendors list
        await this.initializeVendors()
      } catch (error) {
        console.error('❌ Error updating vendor:', error)
        this.showNotification('Failed to update vendor: ' + error.message, 'error')
      } finally {
        this.loading = false
      }
    },

    // Show notification helper
    showNotification(message, color = 'success') {
      this.snackbar.message = message
      this.snackbar.color = color
      this.snackbar.show = true
    },

    // called when Edit button is clicked from VendorDetailsDialog
    handleEditFromDetails(vendorData) {
      this.detailsDialog = false
      this.editData = vendorData
      this.editTargetId = vendorData?.vendorId || vendorData?.id
      this.editDialog = true
    },
  },
}
