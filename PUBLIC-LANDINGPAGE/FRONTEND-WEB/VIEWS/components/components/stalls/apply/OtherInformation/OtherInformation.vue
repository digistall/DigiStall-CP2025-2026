<template>
    <div class="overlay">
        <div class="form-container">
            <!-- Step Indicator -->
            <div class="step-indicator">
                <div v-for="step in totalSteps" :key="step" class="step-dot"
                    :class="{ 'active': step === currentStep, 'completed': step < currentStep }">
                    {{ step }}
                </div>
            </div>

            <!-- Disclaimer Panel -->
            <div v-if="showDisclaimer" class="disclaimer-panel">
                <div class="disclaimer-icon">📋</div>
                <h3>Before You Continue</h3>
                <p class="disclaimer-subtitle">Other Information &amp; Required Documents</p>

                <div class="disclaimer-body">
                    <p>To complete your stall application, the next section will require you to provide the following:</p>
                    <ul class="disclaimer-list">
                        <li>
                            <span class="disclaimer-icon-item">✍️</span>
                            <div>
                                <strong>Signature</strong>
                                <small>A clear image of your handwritten signature</small>
                            </div>
                        </li>
                        <li>
                            <span class="disclaimer-icon-item">🗺️</span>
                            <div>
                                <strong>House Sketch / Location Map</strong>
                                <small>A sketch or photo showing your home address location</small>
                            </div>
                        </li>
                        <li>
                            <span class="disclaimer-icon-item">🪪</span>
                            <div>
                                <strong>Valid Government-Issued ID</strong>
                                <small>A clear photo of any valid government ID (e.g., PhilSys, Passport, Driver's License)</small>
                            </div>
                        </li>
                        <li>
                            <span class="disclaimer-icon-item">📧</span>
                            <div>
                                <strong>Email Address</strong>
                                <small>Your active email — your login credentials will be sent here upon approval</small>
                            </div>
                        </li>
                    </ul>
                    <div class="disclaimer-notice">
                        <span>⚠️</span>
                        <p>Please ensure all uploaded images are clear, legible, and accurate. Incomplete or blurred submissions may delay your application.</p>
                    </div>
                </div>

                <div class="buttons">
                    <button type="button" class="btn-close" @click="$emit('previous')">Back</button>
                    <button type="button" class="btn-next" @click="showDisclaimer = false">I Understand, Proceed</button>
                </div>
            </div>

            <!-- Other Information Form -->
            <template v-else>
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
                        <button type="button" class="btn-close" @click="showDisclaimer = true">Back</button>
                        <button type="button" class="btn-next" @click="goNext">Submit Application</button>
                    </div>
                </form>
            </template>
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
            showDisclaimer: true,
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
            // Note: File inputs cannot be pre-filled for security reasons
            // But we can keep the file references and previews if they exist
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
            // Skip disclaimer if returning to this step with already-saved data
            if (this.savedData.applicantSignature || this.savedData.applicantLocation || this.savedData.applicantValidID) {
                this.showDisclaimer = false;
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
                // Revoke old object URL to free memory before creating a new one
                if (this.previews[field]) {
                    URL.revokeObjectURL(this.previews[field]);
                }
                this.previews[field] = URL.createObjectURL(file);
            }
        },
        removeFile(field) {
            this[field] = null;
            if (this.previews[field]) {
                URL.revokeObjectURL(this.previews[field]);
            }
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

/* Required field marker */
.required-mark {
    color: #dc3545;
    margin-left: 2px;
}

/* Image Preview */
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
    max-height: 200px;
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
    transition: all 0.2s ease;
    min-width: unset;
    font-family: inherit;
    box-shadow: none;
}

.remove-preview-btn:hover {
    background-color: #dc3545;
    color: white;
    transform: none;
}

/* Disclaimer Panel */
.disclaimer-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 4px 0;
}

.disclaimer-panel > .disclaimer-icon {
    font-size: 48px;
    line-height: 1;
}

.disclaimer-panel h3 {
    margin: 0;
    font-size: clamp(20px, 4vw, 24px);
    font-weight: 700;
    color: #002B5B;
    text-align: center;
}

.disclaimer-subtitle {
    margin: 0 !important;
    font-size: 14px !important;
    color: #555 !important;
    font-weight: 500;
    text-align: center;
}

.disclaimer-body {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.disclaimer-body > p {
    margin: 0;
    font-size: 14px;
    color: #444;
    text-align: left;
}

.disclaimer-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.disclaimer-list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: #f0f4ff;
    border: 1px solid #d0dbf0;
    border-radius: 10px;
    padding: 12px 14px;
}

.disclaimer-icon-item {
    font-size: 22px;
    line-height: 1.2;
    flex-shrink: 0;
}

.disclaimer-list li div {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.disclaimer-list li strong {
    font-size: 14px;
    color: #002B5B;
}

.disclaimer-list li small {
    font-size: 12px;
    color: #666;
    font-weight: 400;
}

.disclaimer-notice {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #fff8e1;
    border: 1px solid #ffe082;
    border-radius: 10px;
    padding: 12px 14px;
}

.disclaimer-notice span {
    font-size: 18px;
    flex-shrink: 0;
}

.disclaimer-notice p {
    margin: 0 !important;
    font-size: 13px !important;
    color: #7a5c00 !important;
    text-align: left !important;
    line-height: 1.5;
}

.disclaimer-panel .buttons {
    width: 100%;
    margin-top: 4px;
}
</style>