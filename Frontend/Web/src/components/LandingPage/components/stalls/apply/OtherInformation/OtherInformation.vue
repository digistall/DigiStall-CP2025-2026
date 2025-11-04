<template>
    <div class="overlay">
        <div class="form-container">
            <h3>Other Information</h3>

            <!-- Error Message Display -->
            <div v-if="errorMessage" class="error-message-box">
                <span class="error-text">{{ errorMessage }}</span>
            </div>

            <form @submit.prevent>
                <label>
                    Signature of applicant:
                    <input type="file" accept="image/*" @change="onFileChange('applicantSignature', $event)" required
                        :class="{ 'input-error': errors.applicantSignature }" />
                    <small class="input-hint">Upload image of your signature</small>
                </label>

                <label>
                    House Sketch Location:
                    <input type="file" accept="image/*" @change="onFileChange('applicantLocation', $event)" required
                        :class="{ 'input-error': errors.applicantLocation }" />
                    <small class="input-hint">Upload sketch or map of your house location</small>
                </label>

                <label>
                    Insert a Valid ID:
                    <input type="file" accept="image/*" @change="onFileChange('applicantValidID', $event)" required
                        :class="{ 'input-error': errors.applicantValidID }" />
                    <small class="input-hint">Upload clear photo of government-issued ID</small>
                </label>

                <label>
                    Email Address:
                    <input type="email" v-model="emailAddress" required placeholder="example@email.com"
                        :class="{ 'input-error': errors.emailAddress }" />
                    <small class="input-hint">We'll send confirmation to this email</small>
                </label>

                <div class="buttons">
                    <button type="button" class="btn-close" @click="$emit('previous')">Back</button>
                    <button type="button" class="btn-next" @click="goNext">Submit Application</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
export default {
    name: 'OtherInformation',
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
            applicantSignature: null,
            applicantLocation: null,
            applicantValidID: null,
            emailAddress: '',
            errorMessage: '',
            errors: {
                applicantSignature: false,
                applicantLocation: false,
                applicantValidID: false,
                emailAddress: false
            }
        };
    },
    methods: {
        clearErrors() {
            this.errorMessage = '';
            this.errors = {
                applicantSignature: false,
                applicantLocation: false,
                applicantValidID: false,
                emailAddress: false
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
        onFileChange(field, event) {
            const file = event.target.files[0];
            if (file) {
                this[field] = file;
                // Clear error for this field when file is selected
                this.errors[field] = false;
            }
        },
        goNext() {
            this.clearErrors();

            // Check required fields
            if (!this.applicantSignature || !this.applicantLocation || !this.applicantValidID || !this.emailAddress) {
                const missingFields = [];
                if (!this.applicantSignature) missingFields.push('applicantSignature');
                if (!this.applicantLocation) missingFields.push('applicantLocation');
                if (!this.applicantValidID) missingFields.push('applicantValidID');
                if (!this.emailAddress) missingFields.push('emailAddress');

                this.showError("Please upload all required documents and provide your email address.", missingFields);
                return;
            }

            // Validate email format
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(this.emailAddress)) {
                this.showError("Please enter a valid email address (e.g., example@email.com).", ['emailAddress']);
                return;
            }

            const otherInfoData = {
                applicantSignature: this.applicantSignature,
                applicantLocation: this.applicantLocation,
                applicantValidID: this.applicantValidID,
                emailAddress: this.emailAddress
            };
            this.$emit('next', otherInfoData);
        }
    }
};
</script>

<style scoped>
@import '@/assets/LandingPage/css/applicationformstyle.css';
</style>