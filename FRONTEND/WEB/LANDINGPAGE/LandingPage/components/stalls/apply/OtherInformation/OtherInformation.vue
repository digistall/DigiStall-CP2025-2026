<template>
    <div class="overlay">
        <!-- ── Other Information Form ── -->
        <div class="form-container">
            <!-- Step Indicator -->
            <div class="step-indicator">
                <div v-for="step in totalSteps" :key="step" class="step-dot"
                    :class="{ 'active': step === currentStep, 'completed': step < currentStep }">
                    {{ step }}
                </div>
            </div>

            <h3>Other Information</h3>

            <!-- Error Message Display -->
            <div v-if="errorMessage" class="error-message-box">
                <span class="error-text">{{ errorMessage }}</span>
            </div>

            <form @submit.prevent>
                <!-- Signature Upload -->
                <label>
                    Signature of Applicant: <span class="required-mark">*</span>
                    <input type="file" accept="image/*" @change="onFileChange('applicantSignature', $event)"
                        :class="{ 'input-error': errors.applicantSignature }" />
                    <small class="input-hint">Upload a clear image of your handwritten signature</small>
                </label>
                <div v-if="previews.applicantSignature" class="image-preview-wrapper">
                    <img :src="previews.applicantSignature" alt="Signature Preview" class="image-preview" />
                    <button type="button" class="remove-preview-btn" @click="removeFile('applicantSignature')">✕ Remove</button>
                </div>

                <!-- House Location Upload -->
                <label>
                    House Sketch / Location Map: <span class="required-mark">*</span>
                    <input type="file" accept="image/*" @change="onFileChange('applicantLocation', $event)"
                        :class="{ 'input-error': errors.applicantLocation }" />
                    <small class="input-hint">Upload a sketch or photo map of your house location</small>
                </label>
                <div v-if="previews.applicantLocation" class="image-preview-wrapper">
                    <img :src="previews.applicantLocation" alt="House Location Preview" class="image-preview" />
                    <button type="button" class="remove-preview-btn" @click="removeFile('applicantLocation')">✕ Remove</button>
                </div>

                <!-- Valid ID Upload -->
                <label>
                    Valid Government-Issued ID: <span class="required-mark">*</span>
                    <input type="file" accept="image/*" @change="onFileChange('applicantValidID', $event)"
                        :class="{ 'input-error': errors.applicantValidID }" />
                    <small class="input-hint">Upload a clear photo of your government-issued ID</small>
                </label>
                <div v-if="previews.applicantValidID" class="image-preview-wrapper">
                    <img :src="previews.applicantValidID" alt="Valid ID Preview" class="image-preview" />
                    <button type="button" class="remove-preview-btn" @click="removeFile('applicantValidID')">✕ Remove</button>
                </div>

                <!-- Email Address -->
                <label>
                    Email Address: <span class="required-mark">*</span>
                    <input type="email" v-model="emailAddress" placeholder="example@email.com"
                        :class="{ 'input-error': errors.emailAddress }" />
                    <small class="input-hint">We'll send your login credentials to this email upon approval</small>
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
        },
        savedData: {
            type: Object,
            default: null
        },
        currentStep: {
            type: Number,
            default: 4
        },
        totalSteps: {
            type: Number,
            default: 4
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
            },
            previews: {
                applicantSignature: null,
                applicantLocation: null,
                applicantValidID: null,
            }
        };
    },
    mounted() {
        // Initialize form with saved data if available
        if (this.savedData) {
            this.emailAddress = this.savedData.emailAddress || '';
            if (this.savedData.applicantSignature) {
                this.applicantSignature = this.savedData.applicantSignature;
                this.previews.applicantSignature = URL.createObjectURL(this.savedData.applicantSignature);
            }
            if (this.savedData.applicantLocation) {
                this.applicantLocation = this.savedData.applicantLocation;
                this.previews.applicantLocation = URL.createObjectURL(this.savedData.applicantLocation);
            }
            if (this.savedData.applicantValidID) {
                this.applicantValidID = this.savedData.applicantValidID;
                this.previews.applicantValidID = URL.createObjectURL(this.savedData.applicantValidID);
            }
        }
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
                this.errors[field] = false;
                if (this.previews[field]) URL.revokeObjectURL(this.previews[field]);
                this.previews[field] = URL.createObjectURL(file);
            }
        },
        removeFile(field) {
            this[field] = null;
            if (this.previews[field]) URL.revokeObjectURL(this.previews[field]);
            this.previews[field] = null;
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

/* ── Required field marker ── */
.required-mark {
    color: #dc3545;
    margin-left: 2px;
}

/* ── Image Preview ── */
.image-preview-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-top: -6px;
    margin-bottom: 4px;
}

.image-preview {
    max-width: 100%;
    max-height: 380px;
    width: 100%;
    border-radius: 8px;
    border: 2px solid #002B5B;
    object-fit: contain;
    background: #f0f4ff;
    padding: 4px;
}

.remove-preview-btn {
    background: none;
    border: 1px solid #dc3545;
    color: #dc3545;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    min-width: unset;
    font-family: inherit;
    box-shadow: none;
}

.remove-preview-btn:hover {
    background-color: #dc3545;
    color: white;
    transform: none;
    box-shadow: none;
}
</style>