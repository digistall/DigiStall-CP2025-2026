import stallBackgroundImage from '@/assets/stallbackground.png'
import StallApplicationContainer from './StallApplicationContainer.vue'

export default {
  name: 'StallSection',
  components: {
    StallApplicationContainer,
  },
  data() {
    return {
      stallBackgroundImage,
      showApplyForm: false,
      // General stall info for hero "Apply Now" button
      // This represents a general application (not tied to a specific stall)
      generalStallInfo: {
        stall_id: null, // Will be null for general applications
        stall_code: 'GENERAL-APPLICATION',
        stall_name: 'General Stall Application',
        price_type: 'Fixed Price',
        monthly_rental: 0,
        floor: 'N/A',
        section: 'N/A',
        dimensions: 'To be determined',
        branch: 'Naga City Public Market',
        branchLocation: 'Naga City',
        description: 'General stall application - specific stall will be assigned upon approval',
        isAvailable: true,
      },
    }
  },
  methods: {
    openGeneralApplicationForm() {
      console.log('Opening general application form from hero section')
      this.showApplyForm = true
    },
    closeApplyForm() {
      console.log('Closing general application form')
      this.showApplyForm = false
    },
  },
}
