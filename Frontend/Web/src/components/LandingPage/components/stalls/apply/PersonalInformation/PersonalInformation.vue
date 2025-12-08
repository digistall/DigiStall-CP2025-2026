<template>
    <div class="overlay">
        <div class="form-container">
            <h3>Provide Personal Information</h3>
            <p>The submitted application will be reviewed by the MEPO Administrator for approval.</p>

            <!-- Error Message Display -->
            <div v-if="errorMessage" class="error-message-box">
                <span class="error-text">{{ errorMessage }}</span>
            </div>

            <br>
            <form @submit.prevent>
                <label>
                    Full Name:
                    <input type="text" v-model="fullName" required :class="{ 'input-error': errors.fullName }" />
                </label>

                <label>
                    Highest Educational Attainment:
                    <select v-model="education" required :class="{ 'input-error': errors.education }">
                        <option disabled value="">Please select</option>
                        <option v-for="level in educationLevels" :key="level" :value="level">{{ level }}</option>
                    </select>
                </label>

                <label>
                    Date of Birth:
                    <v-menu v-model="datePickerMenu" :close-on-content-click="false" transition="scale-transition">
                        <template v-slot:activator="{ props }">
                            <input type="text" v-model="formattedBirthdate" v-bind="props" required readonly
                                placeholder="Click to select date" :class="{ 'input-error': errors.birthdate }"
                                style="cursor: pointer;" />
                        </template>

                        <v-date-picker v-model="birthdateDate" @update:model-value="updateBirthdate" :max="maxDate"
                            show-adjacent-months header="Select Birth Date" class="large-date-picker"></v-date-picker>
                    </v-menu>
                    <span v-if="calculatedAge !== null" class="age-display"
                        :class="{ 'age-error': calculatedAge < 18 }">
                        Age: {{ calculatedAge }} years old
                    </span>
                </label>

                <label>
                    Civil Status:
                    <select v-model="civilStatus" required :class="{ 'input-error': errors.civilStatus }">
                        <option disabled value="">Please select</option>
                        <option v-for="status in civilStatusOptions" :key="status" :value="status">{{ status }}</option>
                    </select>
                </label>

                <label>
                    Contact Number:
                    <input type="tel" v-model="contactNumber" required placeholder="09XXXXXXXXX"
                        :class="{ 'input-error': errors.contactNumber }" />
                    <small class="input-hint">Format: 09XXXXXXXXX (11 digits)</small>
                </label>

                <label>
                    Mailing Address:
                    <input type="text" v-model="mailingAddress" required
                        :class="{ 'input-error': errors.mailingAddress }" />
                </label>

                <div class="buttons">
                    <button type="button" class="btn-close" @click="$emit('close')">Close</button>
                    <button type="button" class="btn-next" @click="goNext">Next</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
export default {
    emits: ['close', 'next'],
    props: {
        stall: Object,
    },
    data() {
        return {
            fullName: '',
            education: '',
            birthdate: '',
            birthdateDate: null,
            datePickerMenu: false,
            civilStatus: '',
            contactNumber: '',
            mailingAddress: '',
            errorMessage: '',
            errors: {
                fullName: false,
                education: false,
                birthdate: false,
                civilStatus: false,
                contactNumber: false,
                mailingAddress: false
            },
            educationLevels: [
                'No Formal Education',
                'Elementary Graduate',
                'High School Graduate',
                'Vocational/Trade Course',
                'College Undergraduate',
                'College Graduate',
                'Postgraduate',
            ],
            civilStatusOptions: [
                'Single',
                'Married',
                'Widowed',
                'Divorced',
                'Separated',
            ],
        };
    },
    computed: {
        calculatedAge() {
            if (!this.birthdate) return null;

            const today = new Date();
            const birthDate = new Date(this.birthdate);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return age;
        },
        formattedBirthdate() {
            if (!this.birthdate) return '';
            const date = new Date(this.birthdate);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        },
        maxDate() {
            const today = new Date();
            return today.toISOString().split('T')[0];
        }
    },
    methods: {
        updateBirthdate(date) {
            if (date) {
                this.birthdateDate = date;
                // Fix timezone issue by creating date in local timezone
                const selectedDate = new Date(date);
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                this.birthdate = `${year}-${month}-${day}`;
                this.datePickerMenu = false;
            }
        },
        clearErrors() {
            this.errorMessage = '';
            this.errors = {
                fullName: false,
                education: false,
                birthdate: false,
                civilStatus: false,
                contactNumber: false,
                mailingAddress: false
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
        goNext() {
            this.clearErrors();

            const name = this.fullName.trim();
            const contact = this.contactNumber.trim();
            const address = this.mailingAddress.trim();

            // Check required fields
            if (!name || !this.education || !this.birthdate || !this.civilStatus || !contact || !address) {
                const missingFields = [];
                if (!name) missingFields.push('fullName');
                if (!this.education) missingFields.push('education');
                if (!this.birthdate) missingFields.push('birthdate');
                if (!this.civilStatus) missingFields.push('civilStatus');
                if (!contact) missingFields.push('contactNumber');
                if (!address) missingFields.push('mailingAddress');

                this.showError("Please fill in all required fields.", missingFields);
                return;
            }

            // Check age requirement
            if (this.calculatedAge < 18) {
                this.showError("Applicant must be at least 18 years old to apply.", ['birthdate']);
                return;
            }

            // Check phone number format
            const phonePattern = /^09\d{9}$/;
            if (!phonePattern.test(contact)) {
                this.showError("Contact number must be 11 digits and start with '09' (e.g., 09123456789).", ['contactNumber']);
                return;
            }

            const formData = {
                fullName: name,
                education: this.education,
                birthdate: this.birthdate,
                age: this.calculatedAge,
                civilStatus: this.civilStatus,
                contactNumber: contact,
                mailingAddress: address,
                stall: this.stall
            };

            this.$emit('next', formData);
        }
    }
};
</script>

<style scoped>
@import '@/assets/LandingPage/css/applicationformstyle.css';
</style>