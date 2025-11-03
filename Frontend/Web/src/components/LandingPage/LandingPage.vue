<template>
  <div id="app">
    <HeaderSection />
    <StallSection />
    <VendorSection />
    <ComplianceSection />
    <FooterSection />
  </div>
</template>

<script>
import HeaderSection from "./components/header/HeaderSection.vue";
import StallSection from "./components/stalls/StallSection.vue";
import VendorSection from "./components/vendor/VendorSection.vue";
import ComplianceSection from "./components/compliance/ComplianceSection.vue";
import FooterSection from "./components/footer/FooterSection.vue";

export default {
  name: "LandingPage",
  components: {
    HeaderSection,
    StallSection,
    VendorSection,
    ComplianceSection,
    FooterSection,
  },
};
</script>

<style scoped src="../../assets/css/Global.css"></style>