<template>
    <Teleport to="body">
        <!-- Enhanced Loading Overlay -->
        <ApplicationLoadingOverlay v-if="showForm && isSubmitting" :state="loadingState" :error-message="loadingErrorMessage"
            @retry="retrySubmission" />

        <!-- Step 0: Disclaimer Modal -->
        <Transition name="disclaimer-fade">
            <div v-if="showForm && currentStep === 0 && !isSubmitting" class="disclaimer-overlay">
                <div class="disclaimer-modal">
                    <h3 class="disclaimer-modal-title">Before You Begin</h3>
                    <p class="disclaimer-modal-subtitle">Stall Application — Required Information</p>

                    <p class="disclaimer-modal-intro">
                        To complete your stall application, you will be asked to provide the following information and documents across multiple steps. Please have them ready before proceeding:
                    </p>

                    <ul class="disclaimer-list">
                        <li>
                            <div class="disclaimer-list-bullet">1</div>
                            <div>
                                <strong>Personal Information</strong>
                                <small>Full name, birthdate, civil status, contact number, and mailing address</small>
                            </div>
                        </li>
                        <li>
                            <div class="disclaimer-list-bullet">2</div>
                            <div>
                                <strong>Spouse Information</strong>
                                <small>Required only if civil status is not Single</small>
                            </div>
                        </li>
                        <li>
                            <div class="disclaimer-list-bullet">3</div>
                            <div>
                                <strong>Business Information</strong>
                                <small>Nature of business, capitalization, and source of capital</small>
                            </div>
                        </li>
                        <li>
                            <div class="disclaimer-list-bullet">4</div>
                            <div>
                                <strong>Other Documents</strong>
                                <small>Signature image, house sketch/location map, and a valid government-issued ID</small>
                            </div>
                        </li>
                        <li>
                            <div class="disclaimer-list-bullet">5</div>
                            <div>
                                <strong>Email Address</strong>
                                <small>Your login credentials will be sent here upon approval</small>
                            </div>
                        </li>
                    </ul>

                    <div class="disclaimer-notice">
                        <p>Please ensure all uploaded images are clear and legible. Incomplete or inaccurate submissions may delay the processing of your application.</p>
                    </div>

                    <label class="disclaimer-checkbox-row">
                        <input type="checkbox" v-model="disclaimerAcknowledged" />
                        <span>I have read and understood the requirements above, and I confirm that I am ready to proceed with my application.</span>
                    </label>

                    <div class="disclaimer-actions">
                        <button type="button" class="btn-close" @click="closeForm">Close</button>
                        <button type="button" class="btn-next"
                            :disabled="!disclaimerAcknowledged"
                            :class="{ 'btn-next-disabled': !disclaimerAcknowledged }"
                            @click="currentStep = 1">
                            I Understand, Proceed
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Step 1: Personal Information -->
        <PersonalInformation v-if="showForm && currentStep === 1 && !isSubmitting" :stall="stall" 
            :savedData="personalInfo" :currentStep="currentStep" :totalSteps="4"
            @close="closeForm" @previous="goToPreviousStep" @next="handlePersonalInfoNext" />

        <!-- Step 2: Spouse Information -->
        <SpouseInformation v-if="showForm && currentStep === 2 && !isSubmitting" :stall="stall" :personalInfo="personalInfo"
            :savedData="spouseInfo" :currentStep="currentStep" :totalSteps="4"
            @previous="goToPreviousStep" @next="handleSpouseInfoNext" />

        <!-- Step 3: Business Information -->
        <BusinessInformation v-if="showForm && currentStep === 3 && !isSubmitting" :stall="stall" :personalInfo="personalInfo"
            :spouseInfo="spouseInfo" :savedData="businessInfo" :currentStep="currentStep" :totalSteps="4"
            @previous="goToPreviousStep" @next="handleBusinessInfoNext" @close="closeForm" />

        <!-- Step 4: Other Information -->
        <OtherInformation v-if="showForm && currentStep === 4 && !isSubmitting" :stall="stall" :personalInfo="personalInfo"
            :spouseInfo="spouseInfo" :savedData="otherInfo" :currentStep="currentStep" :totalSteps="4"
            @previous="goToPreviousStep" @next="handleOtherInfoNext" />
    </Teleport>
</template>

<script>
import StallApplicationContainerScript from './StallApplicationContainer.js';
export default {
    ...StallApplicationContainerScript,
    data() {
        return {
            ...StallApplicationContainerScript.data?.call(this) ?? {},
            disclaimerAcknowledged: false,
        };
    },
    watch: {
        showForm(val) {
            if (val) {
                // Reset disclaimer whenever the form is opened
                this.disclaimerAcknowledged = false;
            }
        }
    }
};
</script>

<style scoped>
/* Disclaimer Modal */
.disclaimer-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000000;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
    padding: 20px;
}

.disclaimer-modal {
    background: #fff;
    border-radius: 16px;
    padding: 28px 32px 24px;
    width: 100%;
    max-width: 800px;
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
    to   { opacity: 1; transform: translateY(0) scale(1); }
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
}

.disclaimer-checkbox-row > span {
    font-size: 13px;
    color: #333;
    line-height: 1.5;
}

.disclaimer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 4px;
    flex-wrap: wrap;
}

.btn-next, .btn-close {
    font-weight: 600;
    border: none;
    padding: 12px 22px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 15px;
    transition: all 0.3s ease;
    min-width: 100px;
    font-family: inherit;
}

.btn-next {
    background-color: #002B5B;
    color: white;
    box-shadow: 0 4px 14px rgba(0, 43, 91, 0.3);
}

.btn-next:hover {
    background-color: #12579b;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 43, 91, 0.4);
}

.btn-close {
    background-color: #6c757d;
    color: white;
    box-shadow: 0 4px 14px rgba(108, 117, 125, 0.3);
}

.btn-close:hover {
    background-color: #5a6268;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(108, 117, 125, 0.4);
}

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

/* Transition */
.disclaimer-fade-enter-active,
.disclaimer-fade-leave-active {
    transition: opacity 0.25s ease;
}

.disclaimer-fade-enter-from,
.disclaimer-fade-leave-to {
    opacity: 0;
}
</style>