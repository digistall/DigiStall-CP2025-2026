<template>
    <Teleport to="body">
        <!-- Enhanced Loading Overlay -->
        <ApplicationLoadingOverlay v-if="showForm && isSubmitting" :state="loadingState" :error-message="loadingErrorMessage"
            @retry="retrySubmission" />

        <!-- Step 1: Personal Information -->
        <PersonalInformation v-if="showForm && currentStep === 1 && !isSubmitting" :stall="stall" 
            :savedData="personalInfo" :currentStep="currentStep" :totalSteps="4"
            @close="closeForm" @next="handlePersonalInfoNext" />

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
export default StallApplicationContainerScript;
</script>

<style>
/* Styles removed - child components handle their own overlay styling via applicationformstyle.css */
</style>