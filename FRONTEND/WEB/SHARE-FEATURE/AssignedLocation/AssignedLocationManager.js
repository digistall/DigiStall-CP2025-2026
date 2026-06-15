import SearchLocation from './Components/Search/SearchLocation.vue'
import TableLocation from './Components/Table/TableLocation.vue'
import LocationFormDialog from './Components/LocationFormDialog/LocationFormDialog.vue'
import DeleteLocationDialog from './Components/DeleteLocationDialog/DeleteLocationDialog.vue'
import LoadingOverlay from '@SHARED_COMPONENTS/LoadingOverlay/LoadingOverlay.vue'

import {
  getAllAssignedLocations,
  createAssignedLocation,
  updateAssignedLocation,
  deleteAssignedLocation
} from '@/services/assignedLocationService'

export default {
  name: 'AssignedLocationManager',
  components: {
    SearchLocation,
    TableLocation,
    LocationFormDialog,
    DeleteLocationDialog,
    LoadingOverlay
  },
  data() {
    return {
      // Table data
      locations: [],
      loading: false,

      // Pagination
      page: 1,
      pageSize: 12,
      totalPages: 1,

      // Search & Sort
      search: '',
      sortBy: 'created_at',
      sortDir: 'DESC',

      // Form Dialog
      dialog: false,
      isEditing: false,
      editId: null,
      form: { location_name: '' },
      formErrors: '',
      saving: false,

      // Delete Dialog
      deleteDialog: false,
      deleteTarget: null,
      deleting: false,

      // Snackbar
      snackbar: {
        show: false,
        message: '',
        color: 'success',
        timeout: 3000
      }
    }
  },
  mounted() {
    this.fetchLocations()
  },
  methods: {
    // ===== DATA FETCHING =====
    async fetchLocations() {
      this.loading = true
      try {
        const result = await getAllAssignedLocations({
          search: this.search || undefined,
          sortBy: this.sortBy,
          sortDir: this.sortDir,
          page: this.page,
          pageSize: this.pageSize
        })
        if (result.success) {
          this.locations = result.data
          this.totalPages = result.pagination?.totalPages || 1
        }
      } catch (err) {
        this.showNotification(
          err?.response?.data?.message || 'Failed to load locations.',
          'error'
        )
      } finally {
        this.loading = false
      }
    },

    // ===== SEARCH & SORT =====
    handleSearch(payload) {
      if (!payload) return
      this.search = payload.query || ''
      this.page = 1
      this.fetchLocations()
    },

    handleSortChange({ sortBy, sortDir }) {
      this.sortBy = sortBy
      this.sortDir = sortDir
      this.page = 1
      this.fetchLocations()
    },

    // ===== CREATE / EDIT =====
    openCreateDialog() {
      this.isEditing = false
      this.editId = null
      this.form = { location_name: '' }
      this.formErrors = ''
      this.dialog = true
    },

    openEditDialog(item) {
      this.isEditing = true
      this.editId = item.assigned_location_id
      this.form = { location_name: item.location_name }
      this.formErrors = ''
      this.dialog = true
    },

    closeDialog() {
      this.dialog = false
      this.form = { location_name: '' }
      this.formErrors = ''
    },

    async saveLocation() {
      const name = this.form.location_name?.trim()
      if (!name) {
        this.formErrors = 'Location name is required.'
        return
      }
      if (name.length > 100) {
        this.formErrors = 'Location name must not exceed 100 characters.'
        return
      }

      this.saving = true
      this.formErrors = ''
      try {
        let result
        if (this.isEditing) {
          result = await updateAssignedLocation(this.editId, name)
        } else {
          result = await createAssignedLocation(name)
        }

        if (result.success) {
          this.showNotification(result.message, 'success')
          this.closeDialog()
          this.fetchLocations()
        } else {
          this.formErrors = result.message
        }
      } catch (err) {
        const msg = err?.response?.data?.message || 'Operation failed.'
        this.formErrors = msg
      } finally {
        this.saving = false
      }
    },

    // ===== DELETE =====
    confirmDelete(item) {
      this.deleteTarget = item
      this.deleteDialog = true
    },

    async doDelete() {
      this.deleting = true
      try {
        const result = await deleteAssignedLocation(this.deleteTarget.assigned_location_id)
        if (result.success) {
          this.showNotification(result.message, 'success')
          this.deleteDialog = false
          this.fetchLocations()
        }
      } catch (err) {
        this.showNotification(
          err?.response?.data?.message || 'Delete failed.',
          'error'
        )
      } finally {
        this.deleting = false
      }
    },

    // ===== HELPERS =====
    showNotification(message, color = 'success') {
      this.snackbar.message = message
      this.snackbar.color = color
      this.snackbar.show = true
    }
  }
}
