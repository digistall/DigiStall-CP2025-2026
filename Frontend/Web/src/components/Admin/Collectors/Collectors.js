import SearchCollector from './Components/Search/SearchCollector.vue'
import TableCollector from './Components/Table/TableCollector.vue'
import AddCollectorDialog from './Components/AddCollectorDialog/AddCollectorDialog.vue'
import EditCollectorDialog from './Components/EditCollectorDialog/EditCollectorDialog.vue'
import CollectorDetailsDialog from './Components/CollectorDetailsDialog/CollectorDetailsDialog.vue'

export default {
  name: 'Collectors',
  components: {
    SearchCollector,
    TableCollector,
    AddCollectorDialog,
    EditCollectorDialog,
    CollectorDetailsDialog,
  },
  data() {
    return {
      search: '',
      activeFilter: 'all',
      addDialog: false,
      editDialog: false,
      detailsDialog: false,
      editData: null,
      detailsData: null,

      locations: ['Panganiban', 'Naga City Market', 'Triangulo', 'Concepcion Pequeña'],

      // Mock data
      collectors: Array.from({ length: 14 }, (_, i) => ({
        id: 1000 + i,
        name: 'Peter Corpuz',
        contact: '09123456789',
        location: i % 2 === 0 ? 'Panganiban' : 'Naga City Market',
      })),
    }
  },
  computed: {
    filteredCollectors() {
      let list = this.collectors.slice()
      const q = (this.search || '').toLowerCase().trim()
      if (q) {
        list = list.filter(
          (c) =>
            String(c.id).includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.contact.toLowerCase().includes(q) ||
            c.location.toLowerCase().includes(q),
        )
      }
      if (this.activeFilter && this.activeFilter !== 'all') {
        list = list.filter((c) => c.location === this.activeFilter)
      }
      return list
    },
  },
  methods: {
    handleSearch(searchData) {
      this.search = searchData.query
      this.activeFilter = searchData.filter
    },
    openAddDialog() {
      this.addDialog = true
    },
    handleSave(newCollector) {
      this.collectors.unshift(newCollector)
    },
    handleEditUpdate(updatedCollector) {
      const idx = this.collectors.findIndex((c) => String(c.id) === String(updatedCollector.id))
      if (idx !== -1) {
        this.collectors[idx] = { ...this.collectors[idx], ...updatedCollector }
      }
    },
    edit(collector) {
      this.editData = collector?.raw || collector || {}
      this.editDialog = true
    },
    view(collector) {
      this.detailsData = collector?.raw ||
        collector || {
          firstName: 'Peter',
          lastName: 'Corpuz',
          middleName: 'Reyes',
          birthdate: '1994-10-04',
          gender: 'Male',
          phone: '09123456789',
          email: 'peter.corpuz@email.com',
          collectorId: '123456',
          address: 'Block 6 Lot 15 Maharlika Village Barangay Rosario Naga City',
          location: 'Panganiban',
        }
      this.detailsDialog = true
    },
  },
}
