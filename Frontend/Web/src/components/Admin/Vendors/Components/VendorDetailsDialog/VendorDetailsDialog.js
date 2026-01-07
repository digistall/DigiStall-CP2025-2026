import { computed, reactive, onUnmounted, ref } from 'vue'

export default {
  setup(props, { emit }) {
    // Active tab state
    const activeTab = ref('personal')

    // Support both v-model (modelValue) and :isVisible + @close API
    const model = computed({
      get: () => (props.isVisible === undefined ? props.modelValue : props.isVisible),
      set: (v) => {
        emit('update:modelValue', v)
        if (props.isVisible !== undefined && !v) emit('close')
      },
    })

    // Flatten data for easier access
    const d = computed(() => props.data || {})

    // Names
    const fullName = computed(() =>
      [d.value.first_name, d.value.middle_name, d.value.last_name, d.value.suffix]
        .filter(Boolean)
        .join(' '),
    )
    const spouseFull = computed(() =>
      [d.value.spouse_first_name, d.value.spouse_middle_name, d.value.spouse_last_name]
        .filter(Boolean)
        .join(' '),
    )
    const childFull = computed(() =>
      [d.value.child_first_name, d.value.child_middle_name, d.value.child_last_name]
        .filter(Boolean)
        .join(' '),
    )
    const photoSrc = computed(() => props.photo)

    // All documents in one list
    const allDocuments = [
      { key: 'clearance', label: 'Barangay Business Clearance', fallback: 'Clearance.pdf' },
      { key: 'cedula', label: 'Cedula', fallback: 'Cedula.pdf' },
      { key: 'association', label: 'Association Clearance', fallback: 'Association.pdf' },
      { key: 'votersId', label: "Voter's ID", fallback: 'VotersID.pdf' },
      { key: 'picture', label: '2x2 Picture (White background)', fallback: 'Picture.png' },
      { key: 'healthcard', label: 'Health Card/Yellow Card', fallback: 'healthcard.png' },
    ]

    // --- File helpers (JS-only) ---

    // store blob URLs for File objects so we can revoke later
    const blobUrls = reactive({})

    function toUrl(file) {
      if (!file) return null

      // absolute string URL
      if (typeof file === 'string') {
        try {
          const u = new URL(file)
          return u.href
        } catch {
          // plain filename, not openable without hosting
          return null
        }
      }

      // object with .url property
      if (file && file.url) return file.url

      // File object (from v-file-input)
      if (typeof File !== 'undefined' && file instanceof File) {
        if (!blobUrls[file.name]) blobUrls[file.name] = URL.createObjectURL(file)
        return blobUrls[file.name]
      }

      return null
    }

    function fileName(file, fallback) {
      if (!file) return fallback
      if (typeof file === 'string') {
        const parts = file.split('/')
        return parts[parts.length - 1] || fallback
      }
      return file?.name || fallback
    }

    function downloadFile(file, fallbackName) {
      const url = toUrl(file)
      if (!url) return
      const a = document.createElement('a')
      a.href = url
      const name = typeof file === 'string' ? file.split('/').pop() : file?.name || fallbackName
      a.download = name || fallbackName
      document.body.appendChild(a)
      a.click()
      a.remove()
    }

    function openFile(file) {
      const url = toUrl(file)
      if (!url) return
      window.open(url, '_blank')
    }

    // Action methods
    function editVendor() {
      emit('edit', props.data)
      model.value = false
    }

    function deleteVendor() {
      if (confirm('Are you sure you want to delete this vendor?')) {
        emit('delete', props.data)
        model.value = false
      }
    }

    onUnmounted(() => {
      Object.values(blobUrls).forEach((u) => URL.revokeObjectURL(u))
    })

    return {
      activeTab,
      model,
      d,
      fullName,
      spouseFull,
      childFull,
      photoSrc,
      allDocuments,
      toUrl,
      fileName,
      downloadFile,
      openFile,
      editVendor,
      deleteVendor,
    }
  },
  props: {
    modelValue: { type: Boolean, default: false },
    isVisible: { type: Boolean, required: false },
    data: { type: Object, default: () => ({}) }, // full form payload
    photo: { type: String, default: 'https://i.pravatar.cc/200?img=12' },
  },
  emits: ['update:modelValue', 'close', 'edit', 'delete'],
}
