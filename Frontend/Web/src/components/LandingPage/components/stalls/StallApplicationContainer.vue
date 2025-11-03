<template>
    <div class="overlay" v-if="showForm">
        <!-- Enhanced Loading Overlay -->
        <ApplicationLoadingOverlay 
            v-if="isSubmitting" 
            :state="loadingState" 
            :error-message="loadingErrorMessage"
            @retry="retrySubmission" 
        />

        <!-- Step 1: Personal Information -->
        <PersonalInformation v-if="currentStep === 1 && !isSubmitting" :stall="stall" @close="closeForm"
            @next="handlePersonalInfoNext" />

        <!-- Step 2: Spouse Information -->
        <SpouseInformation v-if="currentStep === 2 && !isSubmitting" :stall="stall" :personalInfo="personalInfo"
            @previous="goToPreviousStep" @next="handleSpouseInfoNext" />

        <!-- Step 3: Business Information -->
        <BusinessInformation v-if="currentStep === 3 && !isSubmitting" :stall="stall" :personalInfo="personalInfo"
            :spouseInfo="spouseInfo" @previous="goToPreviousStep" @next="handleBusinessInfoNext" @close="closeForm" />

        <!-- Step 4: Other Information -->
        <OtherInformation v-if="currentStep === 4 && !isSubmitting" :stall="stall" :personalInfo="personalInfo"
            :spouseInfo="spouseInfo" @previous="goToPreviousStep" @next="handleOtherInfoNext" />
    </div>
</template>

<script>
import StallApplicationContainerScript from './StallApplicationContainer.js';
export default StallApplicationContainerScript;
</script>

<style scoped>
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
</style>