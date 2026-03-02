<template>
    <div class="overlay">

        <!-- ── Disclaimer Modal ── -->
        <Transition name="disclaimer-fade">
            <div v-if="showDisclaimer" class="disclaimer-overlay">
                <div class="disclaimer-modal">
                    <h3 class="disclaimer-modal-title">Before You Continue</h3>
                    <p class="disclaimer-modal-subtitle">Other Information &amp; Required Documents</p>

                    <p class="disclaimer-modal-intro">
                        The next section will ask you to upload the following documents. Please have them ready before proceeding:
                    </p>

                    <ul class="disclaimer-list">
                        <li>
                            <div class="disclaimer-list-bullet">1</div>
                            <div>
                                <strong>Signature</strong>
                                <small>A clear image of your handwritten signature</small>
                            </div>
                        </li>
                        <li>
                            <div class="disclaimer-list-bullet">2</div>
                            <div>
                                <strong>House Sketch / Location Map</strong>
                                <small>A sketch or photo showing your home address location</small>
                            </div>
                        </li>
                        <li>
                            <div class="disclaimer-list-bullet">3</div>
                            <div>
                                <strong>Valid Government-Issued ID</strong>
                                <small>PhilSys, Passport, Driver's License, or any valid government ID</small>
                            </div>
                        </li>
                        <li>
                            <div class="disclaimer-list-bullet">4</div>
                            <div>
                                <strong>Email Address</strong>
                                <small>Your login credentials will be sent here upon approval</small>
                            </div>
                        </li>
                    </ul>

                    <div class="disclaimer-notice">
                        <p>Please ensure all uploaded images are clear and legible. Incomplete or blurred submissions may delay the processing of your application.</p>
                    </div>

                    <label class="disclaimer-checkbox-row">
                        <input type="checkbox" v-model="disclaimerAcknowledged" />
                        <span>I have read and understood the requirements listed above, and I confirm that I am ready to proceed.</span>
                    </label>

                    <div class="disclaimer-actions">
                        <button type="button" class="btn-close" @click="$emit('previous')">Back</button>
                        <button type="button" class="btn-next"
                            :disabled="!disclaimerAcknowledged"
                            :class="{ 'btn-next-disabled': !disclaimerAcknowledged }"
                            @click="showDisclaimer = false">
                            I Understand, Proceed
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

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
            showDisclaimer: true,
            disclaimerAcknowledged: false,
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

/* ── Disclaimer Overlay (sits on top of the blurred form) ── */
.disclaimer-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000000;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
    padding: 20px;
}

.disclaimer-modal {
    background: #fff;
    border-radius: 16px;
    padding: 28px 32px 24px;
    width: 100%;
    max-width: 640px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    gap: 14px;
    animation: disclaimerSlideUp 0.35s ease-out;
}

@keyframes disclaimerSlideUp {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
}

.disclaimer-modal-title {
    margin: 0;
    font-size: clamp(18px, 4vw, 22px);
    font-weight: 700;
    color: #002B5B;
    text-align: center;
}

.disclaimer-modal-subtitle {
    margin: 0;
    font-size: 13px;
    color: #666;
    text-align: center;
    font-weight: 500;
}

.disclaimer-modal-intro {
    margin: 0;
    font-size: 14px;
    color: #444;
    line-height: 1.5;
}

.disclaimer-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.disclaimer-list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: #f0f4ff;
    border: 1px solid #d0dbf0;
    border-radius: 10px;
    padding: 11px 14px;
}

.disclaimer-list-bullet {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background-color: #002B5B;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
}

.disclaimer-list li > div {
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
    background: #fff8e1;
    border: 1px solid #ffe082;
    border-left: 4px solid #f59e0b;
    border-radius: 10px;
    padding: 11px 14px;
}

.disclaimer-notice > p {
    margin: 0;
    font-size: 13px;
    color: #7a5c00;
    line-height: 1.5;
}

/* Acknowledgment Checkbox */
.disclaimer-checkbox-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    padding: 12px 14px;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 10px;
    transition: border-color 0.2s, background 0.2s;
    font-weight: normal;
    flex-direction: row;
}

.disclaimer-checkbox-row:has(input:checked) {
    background: #eefaf2;
    border-color: #28a745;
}

.disclaimer-checkbox-row input[type="checkbox"] {
    width: 18px;
    height: 18px;
    min-width: 18px;
    margin-top: 2px;
    accent-color: #002B5B;
    cursor: pointer;
    border: none;
    box-shadow: none;
    padding: 0;
    transform: none;
}

.disclaimer-checkbox-row input[type="checkbox"]:focus {
    box-shadow: none;
    border-color: transparent;
    transform: none;
}

.disclaimer-checkbox-row > span {
    font-size: 13px;
    color: #333;
    line-height: 1.5;
}

/* Disabled proceed button */
.btn-next-disabled {
    background-color: #a0aec0 !important;
    box-shadow: none !important;
    cursor: not-allowed !important;
    opacity: 0.7;
}

.btn-next-disabled:hover {
    background-color: #a0aec0 !important;
    transform: none !important;
    box-shadow: none !important;
}

.disclaimer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 4px;
    flex-wrap: wrap;
}

/* Transition for the disclaimer overlay */
.disclaimer-fade-enter-active,
.disclaimer-fade-leave-active {
    transition: opacity 0.25s ease;
}

.disclaimer-fade-enter-from,
.disclaimer-fade-leave-to {
    opacity: 0;
}
</style>