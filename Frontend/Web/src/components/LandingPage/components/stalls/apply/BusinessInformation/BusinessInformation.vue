<template>
    <div class="overlay">
        <div class="form-container">
            <h3>Business Information</h3>

            <!-- Error Message Display -->
            <div v-if="errorMessage" class="error-message-box">
                <span class="error-text">{{ errorMessage }}</span>
            </div>

            <form @submit.prevent>
                <label>
                    Nature of Business:
                    <select v-model="natureOfBusiness" required :class="{ 'input-error': errors.natureOfBusiness }">
                        <option disabled value="">Please select</option>
                        <option v-for="business in businessTypes" :key="business" :value="business">{{ business }}
                        </option>
                    </select>
                </label>

                <!-- Show text input when "Other" is selected -->
                <label v-if="natureOfBusiness === 'Other'">
                    Please specify:
                    <input type="text" v-model="otherBusinessType" placeholder="Enter your business type" required
                        :class="{ 'input-error': errors.otherBusinessType }" />
                </label>

                <label>
                    Capitalization:
                    <input type="number" v-model="businessCapitalization" required
                        placeholder="Enter amount (e.g., 50000)"
                        :class="{ 'input-error': errors.businessCapitalization }" />
                    <small class="input-hint">Enter your initial business capital in Philippine Peso</small>
                </label>

                <label>
                    Source of Capital:
                    <select v-model="sourceOfCapital" required :class="{ 'input-error': errors.sourceOfCapital }">
                        <option disabled value="">Please select</option>
                        <option v-for="level in capitalType" :key="level" :value="level">{{ level }}</option>
                    </select>
                </label>

                <label>
                    Previous Business Experience:
                    <input type="text" v-model="previousBusiness" required
                        placeholder="Describe your previous business experience"
                        :class="{ 'input-error': errors.previousBusiness }" />
                    <small class="input-hint">Example: "Sold vegetables at Naga City Market for 5 years"</small>
                </label>

                <label>
                    Relatives who is presently a stall owner @NCPM (If any):
                    <input type="text" v-model="applicantRelative" placeholder="Leave blank if none" />
                    <small class="input-hint">Optional field</small>
                </label>

                <div class="buttons">
                    <button type="button" class="btn-close" @click="$emit('previous')">Back</button>
                    <button type="button" class="btn-next" @click="goNext">Next</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
export default {
    name: 'BusinessInformation',
    emits: ['previous', 'next', 'close'],
    props: {
        stall: Object,
        personalInfo: Object,
        spouseInfo: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            natureOfBusiness: '',
            otherBusinessType: '',
            businessCapitalization: null,
            sourceOfCapital: '',
            previousBusiness: '',
            applicantRelative: '',
            errorMessage: '',
            errors: {
                natureOfBusiness: false,
                otherBusinessType: false,
                businessCapitalization: false,
                sourceOfCapital: false,
                previousBusiness: false
            },
            businessTypes: [
                'Fish and Seafood',
                'Meat',
                'Vegetables and Fruits',
                'Rice and Grains',
                'Clothing and Accessories',
                'Electronics',
                'Home Goods and Appliances',
                'Beauty and Personal Care',
                'Food and Beverages',
                'Hardware and Tools',
                'Toys and Games',
                'Books and Stationery',
                'Flowers and Plants',
                'Handicrafts and Souvenirs',
                'Services (Repair, etc.)',
                'Other'
            ],
            capitalType: [
                'Personal Savings',
                'Loan from Bank/Financial Institution',
                'Loan from Family/Friends',
                'Government Grant',
                'Investor/Partnership',
                'Other Sources'
            ]
        };
    },
    methods: {
        clearErrors() {
            this.errorMessage = '';
            this.errors = {
                natureOfBusiness: false,
                otherBusinessType: false,
                businessCapitalization: false,
                sourceOfCapital: false,
                previousBusiness: false
            };
        },
        showError(message, fields = []) {
            this.errorMessage = message;
            fields.forEach(field => {
                if (this.errors.hasOwnProperty(field)) {
                    this.errors[field] = true;
                }
            });
            // Auto-hide error after 5 seconds
            setTimeout(() => {
                this.errorMessage = '';
            }, 5000);
        },
        goNext() {
            this.clearErrors();

            // Check required fields
            if (!this.natureOfBusiness || !this.businessCapitalization || !this.sourceOfCapital || !this.previousBusiness) {
                const missingFields = [];
                if (!this.natureOfBusiness) missingFields.push('natureOfBusiness');
                if (!this.businessCapitalization) missingFields.push('businessCapitalization');
                if (!this.sourceOfCapital) missingFields.push('sourceOfCapital');
                if (!this.previousBusiness) missingFields.push('previousBusiness');

                this.showError("Please fill in all required business information fields.", missingFields);
                return;
            }

            // Check if "Other" is selected and otherBusinessType is filled
            if (this.natureOfBusiness === 'Other' && !this.otherBusinessType.trim()) {
                this.showError("Please specify your business type when selecting 'Other'.", ['otherBusinessType']);
                return;
            }

            // Validate capitalization amount
            if (this.businessCapitalization <= 0) {
                this.showError("Business capitalization must be greater than zero.", ['businessCapitalization']);
                return;
            }

            const finalBusinessType = this.natureOfBusiness === 'Other'
                ? this.otherBusinessType.trim()
                : this.natureOfBusiness;

            const businessData = {
                natureOfBusiness: finalBusinessType,
                businessCapitalization: this.businessCapitalization,
                sourceOfCapital: this.sourceOfCapital,
                previousBusiness: this.previousBusiness,
                applicantRelative: this.applicantRelative
            };
            this.$emit('next', businessData);
        }
    }
}
</script>

<style scoped>
@import '@/assets/LandingPage/css/applicationformstyle.css';
</style>