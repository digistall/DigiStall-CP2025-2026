<template>
    <div class="overlay">
        <div class="form-container">
            <h3>Other Information</h3>
            <form @submit.prevent>
                <label>
                    Signature of applicant:
                    <input type="file" accept="image/*" @change="onFileChange('applicantSignature', $event)" required />
                </label>

                <label>
                    House Sketch Location:
                    <input type="file" accept="image/*" @change="onFileChange('applicantLocation', $event)" required />
                </label>

                <label>
                    Insert a Valid ID:
                    <input type="file" accept="image/*" @change="onFileChange('applicantValidID', $event)" required />
                </label>

                <label>
                    Email Address:
                    <input type="email" v-model="emailAddress" required />
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
            emailAddress: ''
        };
    },
    methods: {
        onFileChange(field, event) {
            const file = event.target.files[0];
            if (file) {
                this[field] = file;
            }
        },
        goNext() {
            if (!this.applicantSignature || !this.applicantLocation || !this.applicantValidID || !this.emailAddress) {
                console.error("Please fill in all required fields.");
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(this.emailAddress)) {
                console.error("Please enter a valid email address.");
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