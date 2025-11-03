<template>
    <div class="overlay">
        <div class="form-container">
            <h3>Business Information</h3>
            <form @submit.prevent>
                <label>
                    Nature of Business:
                    <select v-model="natureOfBusiness" required>
                        <option disabled value="">Please select</option>
                        <option v-for="business in businessTypes" :key="business" :value="business">{{ business }}
                        </option>
                    </select>
                </label>

                <!-- Show text input when "Other" is selected -->
                <label v-if="natureOfBusiness === 'Other'">
                    Please specify:
                    <input type="text" v-model="otherBusinessType" placeholder="Enter your business type" required />
                </label>

                <label>
                    Capitalization:
                    <input type="number" v-model="businessCapitalization" required />
                </label>

                <label>
                    Source of Capital:
                    <select v-model="sourceOfCapital" required>
                        <option disabled value="">Please select</option>
                        <option v-for="level in capitalType" :key="level" :value="level">{{ level }}</option>
                    </select>
                </label>

                <label>
                    Previous Business Experience:
                    <input type="text" v-model="previousBusiness" required />
                </label>

                <label>
                    Relatives who is presently a stall owner @NCPM (If any):
                    <input type="text" v-model="applicantRelative" />
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
        goNext() {
            if (!this.natureOfBusiness || !this.businessCapitalization || !this.sourceOfCapital || !this.previousBusiness) {
                console.error("Please fill in all required fields.");
                return;
            }

            if (this.natureOfBusiness === 'Other' && !this.otherBusinessType.trim()) {
                console.error("Please specify your business type.");
                return;
            }

            if (this.businessCapitalization <= 0) {
                console.error("Capitalization must be greater than zero.");
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