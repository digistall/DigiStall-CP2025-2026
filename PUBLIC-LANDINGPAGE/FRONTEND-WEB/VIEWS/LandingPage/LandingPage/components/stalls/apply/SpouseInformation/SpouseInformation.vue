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
                    <input type="text" v-model="formattedSpouseBirthdate" @click="datePickerMenu = true" 
                        :required="personalInfo.civilStatus !== 'Single'" readonly
                        placeholder="Click to select date" :class="{ 'input-error': errors.spouseBirthdate }"
                        style="cursor: pointer;" />
                    
                    <v-dialog v-model="datePickerMenu" width="auto" :z-index="9999999">
                        <v-date-picker 
                            v-model="spouseBirthdateDate" 
                            @update:model-value="updateSpouseBirthdate" 
                            :max="maxDate"
                            show-adjacent-months 
                            header="Select Birth Date"
                        ></v-date-picker>
                    </v-dialog>
                    
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
        personalInfo: Object,
        savedData: {
            type: Object,
            default: null
        },
        currentStep: {
            type: Number,
            default: 2
        },
        totalSteps: {
            type: Number,
            default: 4
        }
    },
    data() {
        return {
            spouseName: '',
            spouseBirthdate: '',
            spouseBirthdateDate: null,
            datePickerMenu: false,
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
    mounted() {
        // Initialize form with saved data if available
        if (this.savedData) {
            this.spouseName = this.savedData.spouseName || '';
            this.spouseBirthdate = this.savedData.spouseBirthdate || '';
            this.spouseEducation = this.savedData.spouseEducation || '';
            this.occupation = this.savedData.occupation || '';
            this.spouseContact = this.savedData.spouseContact || '';
            
            // Handle children names - convert array back to string
            if (this.savedData.childrenNames && Array.isArray(this.savedData.childrenNames)) {
                this.childrenNames = this.savedData.childrenNames.join('\n');
            } else {
                this.childrenNames = '';
            }
            
            // Initialize date picker date if birthdate exists
            if (this.spouseBirthdate) {
                this.spouseBirthdateDate = new Date(this.spouseBirthdate);
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
        formattedSpouseBirthdate() {
            if (!this.spouseBirthdate) return '';
            const date = new Date(this.spouseBirthdate);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        },
        maxDate() {
            const today = new Date();
            return today.toISOString().split('T')[0];
        },
        childrenArray() {
            if (!this.childrenNames.trim()) return [];
            return this.childrenNames.trim().split('\n').filter(name => name.trim() !== '');
        }
    },
    methods: {
        updateSpouseBirthdate(date) {
            if (date) {
                this.spouseBirthdateDate = date;
                // Fix timezone issue by creating date in local timezone
                const selectedDate = new Date(date);
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                this.spouseBirthdate = `${year}-${month}-${day}`;
                this.datePickerMenu = false;
            }
        },
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

<!-- Unscoped styles to fix Vuetify date picker z-index -->
<style>
/* Force date picker to appear above the overlay (must be higher than 999999 used by application modal) */
.v-overlay-container {
    z-index: 9999999 !important;
}

.v-overlay.v-menu {
    z-index: 9999999 !important;
}

.v-overlay__content {
    z-index: 9999999 !important;
}

.v-picker {
    z-index: 9999999 !important;
}
</style>