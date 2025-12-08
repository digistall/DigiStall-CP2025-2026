<template>
    <div class="overlay">
        <div class="form-container">
            <h3>Spouse Information</h3>

            <!-- Error Message Display -->
            <div v-if="errorMessage" class="error-message-box">
                <span class="error-text">{{ errorMessage }}</span>
            </div>

            <form @submit.prevent>
                <label>
                    Full Name of Spouse:
                    <input type="text" v-model="spouseName" :required="personalInfo.civilStatus !== 'Single'"
                        :class="{ 'input-error': errors.spouseName }" />
                </label>

                <label>
                    Date of Birth of Spouse:
                    <input type="date" v-model="spouseBirthdate" :required="personalInfo.civilStatus !== 'Single'"
                        :class="{ 'input-error': errors.spouseBirthdate }" />
                    <span v-if="calculatedSpouseAge !== null" class="age-display"
                        :class="{ 'age-error': calculatedSpouseAge < 18 }">Age: {{ calculatedSpouseAge }} years
                        old</span>
                </label>

                <label>
                    Educational Attainment of Spouse:
                    <select v-model="spouseEducation" :required="personalInfo.civilStatus !== 'Single'"
                        :class="{ 'input-error': errors.spouseEducation }">
                        <option disabled value="">Please select</option>
                        <option v-for="level in educationLevels" :key="level" :value="level">
                            {{ level }}
                        </option>
                    </select>
                </label>

                <label>
                    Occupation:
                    <input type="text" v-model="occupation" :required="personalInfo.civilStatus !== 'Single'"
                        :class="{ 'input-error': errors.occupation }" />
                </label>

                <label>
                    Contact Number:
                    <input type="tel" v-model="spouseContact" :required="personalInfo.civilStatus !== 'Single'"
                        placeholder="09XXXXXXXXX" :class="{ 'input-error': errors.spouseContact }" />
                    <small class="input-hint">Format: 09XXXXXXXXX (11 digits)</small>
                </label>

                <div class="children-section">
                    <label class="children-label">
                        Names of Children:
                        <small>(Optional - Enter each child's name on a separate line)</small>
                    </label>
                    <textarea v-model="childrenNames"
                        placeholder="Enter children's names, one per line&#10;Example:&#10;Juan Dela Cruz&#10;Maria Dela Cruz"
                        rows="4" class="children-textarea"></textarea>
                </div>

                <div class="buttons">
                    <button type="button" class="btn-close" @click="$emit('previous')">Back</button>
                    <button type="button" class="btn-next" @click="goNext">Next</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
export default {
    emits: ['previous', 'next'],
    props: {
        stall: Object,
        personalInfo: Object
    },
    data() {
        return {
            spouseName: '',
            spouseBirthdate: '',
            spouseEducation: '',
            educationLevels: [
                'No Formal Education',
                'Elementary Graduate',
                'High School Graduate',
                'Vocational/Trade Course',
                'College Undergraduate',
                'College Graduate',
                'Postgraduate',
            ],
            occupation: '',
            spouseContact: '',
            childrenNames: '',
            errorMessage: '',
            errors: {
                spouseName: false,
                spouseBirthdate: false,
                spouseEducation: false,
                occupation: false,
                spouseContact: false
            }
        }
    },
    computed: {
        calculatedSpouseAge() {
            if (!this.spouseBirthdate) return null;

            const today = new Date();
            const birthDate = new Date(this.spouseBirthdate);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return age;
        },
        childrenArray() {
            if (!this.childrenNames.trim()) return [];
            return this.childrenNames.trim().split('\n').filter(name => name.trim() !== '');
        }
    },
    methods: {
        clearErrors() {
            this.errorMessage = '';
            this.errors = {
                spouseName: false,
                spouseBirthdate: false,
                spouseEducation: false,
                occupation: false,
                spouseContact: false
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

            // Check required fields
            if (!this.spouseName || !this.spouseBirthdate || !this.spouseEducation || !this.occupation || !this.spouseContact) {
                const missingFields = [];
                if (!this.spouseName) missingFields.push('spouseName');
                if (!this.spouseBirthdate) missingFields.push('spouseBirthdate');
                if (!this.spouseEducation) missingFields.push('spouseEducation');
                if (!this.occupation) missingFields.push('occupation');
                if (!this.spouseContact) missingFields.push('spouseContact');

                this.showError("Please fill in all required spouse information fields.", missingFields);
                return;
            }

            // Check spouse age requirement
            if (this.calculatedSpouseAge < 18) {
                this.showError("Spouse must be at least 18 years old.", ['spouseBirthdate']);
                return;
            }

            // Check phone number format
            const phonePattern = /^09\d{9}$/;
            if (!phonePattern.test(this.spouseContact)) {
                this.showError("Contact number must be 11 digits and start with '09' (e.g., 09123456789).", ['spouseContact']);
                return;
            }

            const spouseData = {
                spouseName: this.spouseName,
                spouseBirthdate: this.spouseBirthdate,
                spouseAge: this.calculatedSpouseAge,
                spouseEducation: this.spouseEducation,
                occupation: this.occupation,
                spouseContact: this.spouseContact,
                childrenNames: this.childrenArray
            };

            this.$emit('next', spouseData);
        }
    }
}
</script>

<style scoped>
@import '@/assets/LandingPage/css/applicationformstyle.css';
</style>