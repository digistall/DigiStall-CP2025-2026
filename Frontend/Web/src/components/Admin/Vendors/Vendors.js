/* eslint-disable no-dupe-keys */
import AddVendorDialog from './Components/AddVendorDialog/AddVendorDialog.vue'
import VendorDetailsDialog from './Components/VendorDetailsDialog/VendorDetailsDialog.vue'
import EditVendorDialog from './Components/EditVendorDialog/EditVendorDialog.vue'
import SearchVendor from './Components/Search/SearchVendor.vue'
import TableVendor from './Components/Table/TableVendor.vue'
import vendorsService from '../../../services/vendorsService'
import collectorsService from '../../../services/collectorsService'

export default {
  name: 'Vendors',
  components: { AddVendorDialog, VendorDetailsDialog, EditVendorDialog, SearchVendor, TableVendor },
  data() {
    return {
      addDialog: false,
      detailsDialog: false,
      detailsData: null,
      editDialog: false,
      editData: null, // payload for the dialog (item.raw)
      editTargetId: null, // which row to update

      headers: [
        { title: 'Vendor ID', value: 'id', width: 120 },
        { title: "Vendor's Name", value: 'name' },
        { title: 'Business Name', value: 'business' },
        { title: 'Business Location', value: 'business_location' },
        { title: 'Status', value: 'status', width: 120 },
        { title: 'Actions', value: 'actions', sortable: false, align: 'end', width: 140 },
      ],
      collectors: [],
      statuses: ['Active', 'Inactive', 'On Hold'],

      vendors: [],

      search: '',
      statusFilter: 'all',

      newVendor: {
        id: '',
        name: '',
        business: '',
        business_location: '',
        status: 'Active',
      },    }
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
          (v.business_location || v.collector || '').toString().toLowerCase().includes(term) ||
          v.status.toLowerCase().includes(term)

        const hitsStatus = this.statusFilter === 'all' || v.status === this.statusFilter

        return hitsSearch && hitsStatus
      })
    },
  },
  mounted() {
    this.initializeVendors()
  },
  methods: {
    // open the two-page form
    openAddDialog() {
      this.addDialog = true
    },

    // receive new row and add to table
    handleSave(newRow) {
      this.vendors.unshift(newRow)
    },

    handleSearch(payload) {
      if (!payload) return
      this.search = payload.query || ''
      this.statusFilter = payload.filter || 'all'
    },

    initializeVendors() {
      // Fetch vendors from API
      vendorsService
        .getAllVendors()
        .then((result) => {
          // result is { success, data, count }
          const data = result?.data || []
          console.debug('Vendors API result:', result)
          // Transform to compact table rows expected by component
          this.vendors = (data || []).map((v) => ({
            id: v.vendor_id || v.vendorId || v.id,
            name: `${v.first_name || ''} ${v.last_name || ''}`.trim(),
            business: v.business_name || v.business || '-',
            business_location: v.address || '-',
            status: v.status || 'Active',
            collector: (v.collector_first_name && v.collector_last_name)
              ? `${v.collector_first_name} ${v.collector_last_name}`
              : v.collector || null,
            raw: v,
          }))
        })
        .catch((err) => {
          console.error('Failed to load vendors:', err)
        })

      // Fetch collectors for select lists
      collectorsService
        .getAllCollectors()
        .then((result) => {
          // result is { success, data, count }
          const data = result?.data || []
          console.debug('Collectors API result:', result)
          // Keep collectors as array of objects so we can map id -> name later
          this.collectors = (data || []).map((c) => ({
            id: c.collector_id || c.id,
            name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
            raw: c,
          }))
        })
        .catch((err) => {
          console.error('Failed to load collectors:', err)
        })
    },

    edit(row) {
      console.log('edit', row)
    },

    view(row) {
      this.detailsData = row || {
        lastName: 'Dela Cruz',
        firstName: 'Juan',
        middleName: 'Perez',
        suffix: 'Jr.',
        birthdate: '1990-10-05',
        gender: 'Male',
        phone: '09123456789',
        email: 'juan.delacruz@email.com',
        vendorId: '123456',
        address: 'Block 6 Lot 15 Maharlika Village Barangay Rosario Naga City',
        spouseFirst: 'Jessa',
        spouseMiddle: 'Caceres',
        spouseLast: 'Dela Cruz',
        childFirst: 'Pedro',
        childMiddle: 'Caceres',
        childLast: 'Dela Cruz',
        businessName: "Juan's Street Foods",
        businessType: 'Street Foods',
        productsSold: 'Street Foods',
        vendStart: '09:00',
        vendEnd: '13:00',
        businessAddress: 'Panganiban Naga City',
        files: {
          clearance: 'Clearance.pdf',
          votersId: 'VotersID.pdf',
          cedula: 'Cedula.pdf',
          picture: 'Picture.png',
          association: 'Association.pdf',
          healthcard: 'healthcard.png',
        },
      }
      this.detailsDialog = true
    },
    edit(row) {
      // row is the compact row or item.raw (prefer item.raw from your Add form)
      // If you only have the compact row, you can still open with fallback data.
      const raw = row?.raw ||
        row || {
          lastName: 'Dela Cruz',
          firstName: 'Juan',
          middleName: 'Perez',
          suffix: 'Jr.',
          birthdate: '1990-10-05',
          gender: 'Male',
          phone: '09123456789',
          email: 'juan.delacruz@email.com',
          vendorId: String(row?.id || '123456'),
          address: 'Block 6 Lot 15 Maharlika Village Barangay Rosario Naga City',
          spouseFirst: 'Jessa',
          spouseMiddle: 'Caceres',
          spouseLast: 'Dela Cruz',
          childFirst: 'Pedro',
          childMiddle: 'Caceres',
          childLast: 'Dela Cruz',
          businessName: "Juan's Street Foods",
          businessType: 'Street Foods',
          productsSold: 'Street Foods',
          vendStart: '09:00',
          vendEnd: '13:00',
          businessAddress: 'Panganiban Naga City',
          files: {
            clearance: 'Clearance.pdf',
            votersId: 'VotersID.pdf',
            cedula: 'Cedula.pdf',
            picture: 'Picture.png',
            association: 'Association.pdf',
            healthcard: 'healthcard.png',
          },
        }

      this.editData = raw
      this.editTargetId = row?.id || raw?.vendorId
      this.editDialog = true
    },

    // called when Edit dialog submits
    handleEditUpdate(updatedRow) {
      // find row by previous id (editTargetId), then update fields + raw payload
      const idx = this.vendors.findIndex((v) => String(v.id) === String(this.editTargetId))
      if (idx !== -1) {
        this.vendors[idx] = { ...this.vendors[idx], ...updatedRow }
      } else {
        // if not found, add it (edge case)
        this.vendors.unshift(updatedRow)
      }
    },
  },
}
