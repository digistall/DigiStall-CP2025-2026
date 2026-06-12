import LoadingOverlay from '@common/LoadingOverlay/LoadingOverlay.vue'
import { sendApprovalEmailWithRetry } from '../../../Applicants/Components/emailJS/emailService.js'

export default {
  name: 'AddStallholder',
  components: {
    LoadingOverlay,
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      currentStep: 0,
      isFormValid: false,
      isSubmitting: false,
      loadingStalls: false,
      availableStalls: [],
      signatureSaved: false,
      mapSearchQuery: '',
      
      // Date Pickers Menus & Vals
      birthdateMenu: false,
      birthdateDateVal: null,
      spouseBirthdateMenu: false,
      spouseBirthdateDateVal: null,
      contractStartMenu: false,
      contractStartDateVal: null,
      contractEndMenu: false,
      contractEndDateVal: null,

      // Snackbar Notification State
      snackbar: {
        show: false,
        message: '',
        color: 'success'
      },

      // Leaflet Map State
      mapInstance: null,
      markerInstance: null,
      mapCoords: { lat: 13.6218, lng: 123.1948 }, // Naga City default
      
      // Signature Canvas State
      sigCanvas: null,
      sigCtx: null,
      isDrawing: false,

      steps: [
        { name: 'Personal', index: 0 },
        { name: 'Location', index: 1 },
        { name: 'Signature', index: 2 },
        { name: 'Business', index: 3 },
        { name: 'Spouse', index: 4 },
        { name: 'Contract', index: 5 },
        { name: 'Account', index: 6 }
      ],

      formData: {
        // Personal
        fullName: '',
        birthdate: '',
        gender: '',
        civilStatus: '',
        contactNumber: '',
        educationalAttainment: '',

        // Location & Documents
        address: '',
        signature_data: null,
        house_location_data: null,

        // Business
        businessName: '',
        capitalization: '',
        sourceOfCapital: '',
        previousExperience: '',
        relativeStallOwner: 'No',

        // Spouse
        spouseName: '',
        spouseBirthdate: '',
        spouseContact: '',
        spouseOccupation: '',
        spouseEducation: '',

        // Contract
        branchId: '',
        stallId: '',
        contractStartDate: '',
        contractEndDate: '',
        monthlyRent: '',
        leaseAmount: '',
        notes: '',

        // Account
        email: ''
      },

      // Selection options
      educationLevels: [
        'No Formal Education',
        'Elementary Graduate',
        'High School Graduate',
        'Vocational/Trade Course',
        'College Undergraduate',
        'College Graduate',
        'Postgraduate',
      ],

      capitalTypes: [
        'Personal Savings',
        'Loan from Bank/Financial Institution',
        'Loan from Family/Friends',
        'Government Grant',
        'Investor/Partnership',
        'Other Sources'
      ],

      isRentReadOnly: false,

      // Validation Rules
      nameRules: [
        v => !!v || 'Full name is required',
        v => (v && v.trim().length >= 2) || 'Name must be at least 2 characters'
      ],
      emailRules: [
        v => !!v || 'Email is required',
        v => /.+@.+\..+/.test(v) || 'Email must be valid'
      ],
      phoneRules: [
        v => !!v || 'Phone number is required',
        v => /^09\d{9}$/.test(v) || 'Phone number must start with 09 and have 11 digits'
      ],
      addressRules: [
        v => !!v || 'Mailing address is required',
        v => (v && v.trim().length >= 5) || 'Address must be at least 5 characters'
      ]
    }
  },
  computed: {
    formattedBirthdate() {
      if (!this.formData.birthdate) return '';
      const date = new Date(this.formData.birthdate);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    formattedSpouseBirthdate() {
      if (!this.formData.spouseBirthdate) return '';
      const date = new Date(this.formData.spouseBirthdate);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    formattedContractStartDate() {
      if (!this.formData.contractStartDate) return '';
      const date = new Date(this.formData.contractStartDate);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    formattedContractEndDate() {
      if (!this.formData.contractEndDate) return '';
      const date = new Date(this.formData.contractEndDate);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    maxDate() {
      return new Date().toISOString().split('T')[0];
    },
    visibleSteps() {
      if (this.formData.civilStatus === 'Single') {
        return this.steps.filter(s => s.index !== 4);
      }
      return this.steps;
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.currentStep = 0;
        this.signatureSaved = false;
        this.resetForm();
        this.loadStalls();
      } else {
        this.destroyMap();
      }
    },
    currentStep(newVal) {
      if (newVal === 1) {
        // Initialize interactive Leaflet map when stepping onto Location tab
        this.$nextTick(() => {
          this.initMap();
        });
      } else if (newVal === 2) {
        // Initialize signature drawing canvas
        this.$nextTick(() => {
          this.initSignatureCanvas();
        });
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },

    resetForm() {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      this.formData = {
        fullName: '',
        birthdate: '',
        gender: '',
        civilStatus: '',
        contactNumber: '',
        educationalAttainment: '',
        address: '',
        signature_data: null,
        house_location_data: null,
        businessName: '',
        capitalization: '',
        sourceOfCapital: '',
        previousExperience: '',
        relativeStallOwner: 'No',
        spouseName: '',
        spouseBirthdate: '',
        spouseContact: '',
        spouseOccupation: '',
        spouseEducation: '',
        branchId: '',
        stallId: '',
        contractStartDate: todayStr,
        contractEndDate: '',
        monthlyRent: '',
        leaseAmount: '',
        notes: '',
        email: ''
      };
      this.currentStep = 0;
      this.signatureSaved = false;
      this.mapSearchQuery = '';
      this.isFormValid = false;
      this.isSubmitting = false;
      this.isRentReadOnly = false;
      this.mapCoords = { lat: 13.6218, lng: 123.1948 };
      
      // Reset date pickers
      this.birthdateMenu = false;
      this.birthdateDateVal = null;
      this.spouseBirthdateMenu = false;
      this.spouseBirthdateDateVal = null;
      this.contractStartMenu = false;
      this.contractStartDateVal = today;
      this.contractEndMenu = false;
      this.contractEndDateVal = null;
      
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }
      this.destroyMap();
    },

    updateBirthdate(date) {
      if (date) {
        this.birthdateDateVal = date;
        const selected = new Date(date);
        const yyyy = selected.getFullYear();
        const mm = String(selected.getMonth() + 1).padStart(2, '0');
        const dd = String(selected.getDate()).padStart(2, '0');
        this.formData.birthdate = `${yyyy}-${mm}-${dd}`;
        this.birthdateMenu = false;
      }
    },

    updateSpouseBirthdate(date) {
      if (date) {
        this.spouseBirthdateDateVal = date;
        const selected = new Date(date);
        const yyyy = selected.getFullYear();
        const mm = String(selected.getMonth() + 1).padStart(2, '0');
        const dd = String(selected.getDate()).padStart(2, '0');
        this.formData.spouseBirthdate = `${yyyy}-${mm}-${dd}`;
        this.spouseBirthdateMenu = false;
      }
    },

    updateContractStartDate(date) {
      if (date) {
        this.contractStartDateVal = date;
        const selected = new Date(date);
        const yyyy = selected.getFullYear();
        const mm = String(selected.getMonth() + 1).padStart(2, '0');
        const dd = String(selected.getDate()).padStart(2, '0');
        const formatted = `${yyyy}-${mm}-${dd}`;
        this.formData.contractStartDate = formatted;
        this.contractStartMenu = false;
        this.onContractStartChanged(formatted);
      }
    },

    updateContractEndDate(date) {
      if (date) {
        this.contractEndDateVal = date;
        const selected = new Date(date);
        const yyyy = selected.getFullYear();
        const mm = String(selected.getMonth() + 1).padStart(2, '0');
        const dd = String(selected.getDate()).padStart(2, '0');
        this.formData.contractEndDate = `${yyyy}-${mm}-${dd}`;
        this.contractEndMenu = false;
      }
    },

    // Step Navigation with validation
    goToStep(idx) {
      if (this.formData.civilStatus === 'Single' && idx === 4) return;
      // Allow going backward freely or forward if current is valid
      if (idx < this.currentStep) {
        this.currentStep = idx;
      } else {
        // Quick validation walkthrough
        for (let i = this.currentStep; i < idx; i++) {
          if (this.formData.civilStatus === 'Single' && i === 4) continue;
          if (!this.validateStep(i)) return;
        }
        this.currentStep = idx;
      }
    },

    nextStep() {
      if (this.validateStep(this.currentStep)) {
        if (this.currentStep < this.steps.length - 1) {
          let next = this.currentStep + 1;
          if (this.formData.civilStatus === 'Single' && next === 4) {
            next++;
          }
          this.currentStep = next;
        }
      }
    },

    prevStep() {
      if (this.currentStep > 0) {
        let prev = this.currentStep - 1;
        if (this.formData.civilStatus === 'Single' && prev === 4) {
          prev--;
        }
        this.currentStep = prev;
      }
    },

    showNotification(message, color = 'success') {
      this.snackbar.message = message;
      this.snackbar.color = color;
      this.snackbar.show = true;
    },

    validateStep(stepIdx) {
      if (stepIdx === 0) {
        // Personal Info Validation
        if (!this.formData.fullName || this.formData.fullName.trim().length < 2) {
          this.showNotification('Please enter a valid full name.', 'error');
          return false;
        }
        if (!this.formData.gender) {
          this.showNotification('Please select a gender (strictly required).', 'error');
          return false;
        }
        if (!this.formData.civilStatus) {
          this.showNotification('Please select civil status.', 'error');
          return false;
        }
        if (!this.formData.contactNumber || !/^09\d{9}$/.test(this.formData.contactNumber)) {
          this.showNotification('Please enter a valid 11-digit phone number (starts with 09).', 'error');
          return false;
        }
        if (!this.formData.birthdate) {
          this.showNotification('Please select birth date.', 'error');
          return false;
        }
        if (!this.formData.educationalAttainment) {
          this.showNotification('Please select educational attainment.', 'error');
          return false;
        }
      } else if (stepIdx === 1) {
        // Location Pinning Validation
        if (!this.formData.address || this.formData.address.trim().length < 5) {
          this.showNotification('Please pin your home location on the map or enter a valid street address.', 'error');
          return false;
        }
      } else if (stepIdx === 2) {
        // Signature Drawing Validation
        if (!this.signatureSaved || !this.formData.signature_data) {
          this.showNotification('Please draw a signature on the canvas and click "Capture & Lock".', 'error');
          return false;
        }
      } else if (stepIdx === 3) {
        // Business Info Validation
        if (!this.formData.businessName) {
          this.showNotification('Please enter business name.', 'error');
          return false;
        }
        if (!this.formData.capitalization || parseFloat(this.formData.capitalization) <= 0) {
          this.showNotification('Please enter a valid capitalization amount.', 'error');
          return false;
        }
        if (!this.formData.sourceOfCapital) {
          this.showNotification('Please enter source of capital.', 'error');
          return false;
        }
        if (!this.formData.relativeStallOwner) {
          this.showNotification('Please select Relative Option.', 'error');
          return false;
        }
      } else if (stepIdx === 5) {
        // Stall & Lease contract validation
        if (!this.formData.stallId) {
          this.showNotification('Please assign an available stall.', 'error');
          return false;
        }
        if (!this.formData.monthlyRent || parseFloat(this.formData.monthlyRent) <= 0) {
          this.showNotification('Please enter monthly rent.', 'error');
          return false;
        }
        if (!this.formData.contractStartDate) {
          this.showNotification('Please select contract start date.', 'error');
          return false;
        }
        if (!this.formData.contractEndDate) {
          this.showNotification('Please select contract end date.', 'error');
          return false;
        }
      }
      return true;
    },

    // Load available stalls dynamically
    async loadStalls() {
      this.loadingStalls = true;
      try {
        const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('accessToken') || localStorage.getItem('authToken') || localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/stallholders/available-stalls', { headers });
        const resData = await response.json();
        if (resData.success && resData.data) {
          this.availableStalls = resData.data.map(s => ({
            ...s,
            stall_label: `${s.branch_name} - ${s.floor_name} (${s.stall_no}) - ${s.price_type || 'Fixed Price'} - PHP ${s.rental_price}`
          }));
        }
      } catch (err) {
        console.error('Failed to load available stalls:', err);
      } finally {
        this.loadingStalls = false;
      }
    },

    onStallSelected(stallId) {
      const selected = this.availableStalls.find(s => s.stall_id === stallId);
      if (selected) {
        this.formData.branchId = selected.branch_id || 1;
        const type = selected.price_type || 'Fixed Price';
        if (type === 'Fixed Price' || type === 'Raffle') {
          this.formData.monthlyRent = selected.rental_price;
          this.formData.leaseAmount = selected.rental_price;
          this.isRentReadOnly = true;
        } else if (type === 'Auction') {
          this.formData.monthlyRent = '';
          this.formData.leaseAmount = '';
          this.isRentReadOnly = false;
        }
      } else {
        this.formData.monthlyRent = '';
        this.formData.leaseAmount = '';
        this.isRentReadOnly = false;
      }
    },

    onContractStartChanged(startDate) {
      // Contract end date is strictly manual input by the admin, so we do not auto-calculate it anymore.
    },

    async searchLocation() {
      if (!this.mapSearchQuery || !this.mapSearchQuery.trim()) {
        this.showNotification('Please enter a location to search.', 'error');
        return;
      }
      
      this.isSubmitting = true;
      try {
        console.log('🔍 Searching location:', this.mapSearchQuery);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.mapSearchQuery.trim())}&limit=1`);
        const data = await res.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          
          console.log('📍 Location found:', result.display_name, lat, lng);
          
          this.mapCoords.lat = lat;
          this.mapCoords.lng = lng;
          
          if (this.mapInstance && this.markerInstance) {
            this.mapInstance.setView([lat, lng], 16);
            this.markerInstance.setLatLng([lat, lng]);
          }
          
          this.formData.address = result.display_name;
          
          // Atomically fetch and store static geocoded map screenshot
          this.fetchStaticMapBase64(lat, lng).then(base64 => {
            if (base64) {
              this.formData.house_location_data = base64;
            }
          });
          
          this.showNotification('Location successfully pinned on map!', 'success');
        } else {
          this.showNotification('Location not found. Please try a different query.', 'error');
        }
      } catch (err) {
        console.error('Error searching location:', err);
        this.showNotification('Failed to search location. Please try again.', 'error');
      } finally {
        this.isSubmitting = false;
      }
    },

    // Leaflet Dynamic Dynamic script loader
    loadLeaflet() {
      return new Promise((resolve) => {
        if (window.L) {
          resolve(window.L);
          return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          resolve(window.L);
        };
        document.body.appendChild(script);
      });
    },

    async initMap() {
      if (this.mapInstance) {
        setTimeout(() => {
          this.mapInstance.invalidateSize();
        }, 100);
        return;
      }

      const L = await this.loadLeaflet();
      
      const lat = this.mapCoords.lat;
      const lng = this.mapCoords.lng;
      
      this.mapInstance = L.map('admin-map').setView([lat, lng], 15);
      
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps'
      }).addTo(this.mapInstance);
      
      // Draggable marker centered on Naga City
      this.markerInstance = L.marker([lat, lng], { draggable: true }).addTo(this.mapInstance);
      
      this.markerInstance.on('dragend', () => {
        const pos = this.markerInstance.getLatLng();
        this.mapCoords.lat = pos.lat;
        this.mapCoords.lng = pos.lng;
        this.reverseGeocode(pos.lat, pos.lng);
      });

      this.mapInstance.on('click', (e) => {
        this.markerInstance.setLatLng(e.latlng);
        this.mapCoords.lat = e.latlng.lat;
        this.mapCoords.lng = e.latlng.lng;
        this.reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      if (!this.formData.address) {
        this.reverseGeocode(lat, lng);
      }
    },

    destroyMap() {
      if (this.mapInstance) {
        this.mapInstance.remove();
        this.mapInstance = null;
        this.markerInstance = null;
      }
    },

    async reverseGeocode(lat, lng) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await res.json();
        if (data && data.display_name) {
          this.formData.address = data.display_name;
        }

        // Atomically fetch and store static geocoded map screenshot
        this.fetchStaticMapBase64(lat, lng).then(base64 => {
          if (base64) {
            this.formData.house_location_data = base64;
          }
        });
      } catch (err) {
        console.error('Reverse geocoding error:', err);
      }
    },

    async fetchStaticMapBase64(lat, lng) {
      try {
        // Fetch static map from Yandex static map API (CORS-friendly open endpoint)
        const staticMapUrl = `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=16&size=450,450&l=map&pt=${lng},${lat},pm2rdl`;
        const res = await fetch(staticMapUrl);
        if (!res.ok) throw new Error('Static map fetch failed');
        const blob = await res.blob();
        
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn('⚠️ Yandex static map failed, trying fallback standard canvas map snapshot:', e.message);
        
        // Solid canvas fallback: draw Naga City map placeholder screenshot
        const canvas = document.createElement('canvas');
        canvas.width = 450;
        canvas.height = 450;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, 0, 450, 450);
        ctx.fillStyle = '#0f172a';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`GEOC_MAP PIN: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 225, 200);
        ctx.font = '12px sans-serif';
        ctx.fillText('Naga City MEPO Stall Map Sketch', 225, 240);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(225, 150, 8, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas.toDataURL('image/png');
      }
    },

    // Signature Canvas mouse/touch event listeners
    initSignatureCanvas() {
      const canvas = document.getElementById('admin-sig-canvas');
      if (!canvas) return;

      this.sigCanvas = canvas;
      this.sigCtx = canvas.getContext('2d');

      // Adjust dimensions to actual layout sizes
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      this.sigCtx.strokeStyle = '#1e3a8a';
      this.sigCtx.lineWidth = 3;
      this.sigCtx.lineCap = 'round';
      
      this.isDrawing = false;

      const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };

      const start = (e) => {
        e.preventDefault();
        const pos = getPos(e);
        this.sigCtx.beginPath();
        this.sigCtx.moveTo(pos.x, pos.y);
        this.isDrawing = true;
      };

      const move = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        this.sigCtx.lineTo(pos.x, pos.y);
        this.sigCtx.stroke();
      };

      const stop = () => {
        this.isDrawing = false;
      };

      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', move);
      canvas.addEventListener('mouseup', stop);
      canvas.addEventListener('mouseleave', stop);

      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', move, { passive: false });
      canvas.addEventListener('touchend', stop);
    },

    clearSignature() {
      if (this.sigCanvas && this.sigCtx) {
        this.sigCtx.clearRect(0, 0, this.sigCanvas.width, this.sigCanvas.height);
        this.signatureSaved = false;
        this.formData.signature_data = null;
      }
    },

    saveSignature() {
      if (this.sigCanvas) {
        const base64 = this.sigCanvas.toDataURL('image/png');
        this.formData.signature_data = base64;
        this.signatureSaved = true;
      }
    },

    async submitForm() {
      // Validate full form (skip step 4 validation as it is optional, but validate personal, location, canvas, business, and contract)
      if (!this.validateStep(0) || !this.validateStep(1) || !this.validateStep(2) || !this.validateStep(3) || !this.validateStep(5)) {
        return;
      }
      
      if (!this.formData.email || !/.+@.+\..+/.test(this.formData.email)) {
        this.showNotification('Please enter a valid email address.', 'error');
        return;
      }

      this.isSubmitting = true;

      try {
        console.log('📤 Submitting wizard data manually to backend...');
        
        // Prepare sanitised body payload
        const submitData = { ...this.formData };
        submitData.stallholderName = this.formData.fullName; // Map frontend fullName to backend stallholderName
        if (submitData.civilStatus === 'Single') {
          submitData.spouseName = '';
          submitData.spouseBirthdate = '';
          submitData.spouseContact = '';
          submitData.spouseOccupation = '';
          submitData.spouseEducation = '';
        }
        // Ensure leaseAmount is synchronized with monthlyRent
        submitData.leaseAmount = submitData.monthlyRent;

        const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('accessToken') || localStorage.getItem('authToken') || localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/stallholders', {
          method: 'POST',
          headers,
          body: JSON.stringify(submitData)
        });

        const resData = await response.json();
        console.log('✅ Response:', resData);

        if (!response.ok || !resData.success) {
          throw new Error(resData.message || 'Failed to submit stallholder data');
        }

        // Send approval credentials welcome email via EmailJS from frontend
        try {
          const emailRes = await sendApprovalEmailWithRetry(
            this.formData.email,
            this.formData.fullName,
            resData.data.username || this.formData.email,
            resData.data.password || 'Temporary password generated successfully.'
          );
          if (emailRes.success) {
            console.log('✅ Welcome email dispatched successfully via frontend EmailJS');
          } else {
            console.warn('⚠️ Frontend EmailJS failed to send email:', emailRes.message);
          }
        } catch (emailErr) {
          console.error('❌ Frontend EmailJS error:', emailErr);
        }

        // Map response back to frontend list structure
        const addedStallholder = {
          id: resData.data?.stallholderId || Date.now(),
          fullName: this.formData.fullName,
          email: this.formData.email,
          phoneNumber: this.formData.contactNumber,
          address: this.formData.address,
          status: 'Active',
          dateAdded: new Date().toLocaleDateString(),
          documents: [],
          stallNumber: this.availableStalls.find(s => s.stall_id === this.formData.stallId)?.stall_no || 'N/A',
          businessName: this.formData.businessName
        };

        // Emit new stallholder back to parent
        this.$emit('add-stallholder', addedStallholder);
        
        this.$emit('stallholder-added', {
          success: true,
          message: 'Stallholder successfully onboarded and credentials emailed!',
          data: addedStallholder
        });

        // Show a premium success snackbar to the admin
        this.showNotification('Stallholder successfully manually onboarded!', 'success');

        this.closeModal();
      } catch (err) {
        console.error('Error manually adding stallholder:', err);
        this.showNotification(err.message || 'Failed to manually add stallholder.', 'error');
        
        this.$emit('stallholder-added', {
          success: false,
          message: err.message || 'Failed to manually add stallholder.',
          error: err
        });
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}