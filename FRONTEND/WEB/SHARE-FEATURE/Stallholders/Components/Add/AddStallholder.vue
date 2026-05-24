<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-dialog v-model="isVisible" max-width="900px" persistent>
    <v-card class="add-stallholder-modal">
      <!-- Header -->
      <v-card-title class="modal-header">
        <h2 class="modal-title">Manually Add Stallholder & Contract</h2>
        <v-btn 
          icon 
          class="close-btn" 
          @click="closeModal"
        >
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Stepper Progress Header -->
      <div class="stepper-header-custom">
        <div 
          v-for="(step, idx) in visibleSteps" 
          :key="step.index" 
          class="step-item"
          :class="{ 'active': currentStep === step.index, 'completed': currentStep > step.index }"
          @click="goToStep(step.index)"
        >
          <div class="step-badge">{{ idx + 1 }}</div>
          <span class="step-name">{{ step.name }}</span>
        </div>
      </div>

      <!-- Main Content -->
      <v-card-text class="modal-content">
        <v-form ref="form" v-model="isFormValid" lazy-validation>
          
          <!-- STEP 0: Personal Info -->
          <div v-show="currentStep === 0" class="step-content">
            <h3 class="step-title">Personal Information</h3>
            <p class="step-subtitle">Strictly required fields for basic registration.</p>
            
            <v-row>
              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Full Name: <span class="required">*</span></label>
                  <v-text-field
                    v-model="formData.fullName"
                    :rules="nameRules"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Last Name, First Name, Middle Name"
                    class="form-input"
                  ></v-text-field>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Gender: <span class="required">*</span></label>
                  <v-select
                    v-model="formData.gender"
                    :items="['Male', 'Female', 'LGBTQ']"
                    :rules="[v => !!v || 'Gender is required']"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Select Gender"
                    class="form-input"
                  ></v-select>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Civil Status: <span class="required">*</span></label>
                  <v-select
                    v-model="formData.civilStatus"
                    :items="['Single', 'Married', 'Widowed', 'Divorced', 'Separated']"
                    :rules="[v => !!v || 'Civil status is required']"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Select Status"
                    class="form-input"
                  ></v-select>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Phone Number: <span class="required">*</span></label>
                  <v-text-field
                    v-model="formData.contactNumber"
                    :rules="phoneRules"
                    variant="outlined"
                    density="comfortable"
                    placeholder="09XXXXXXXXX"
                    class="form-input"
                  ></v-text-field>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Birth Date: <span class="required">*</span></label>
                  <v-text-field
                    :model-value="formattedBirthdate"
                    readonly
                    @click="birthdateMenu = true"
                    :rules="[v => !!v || 'Birth date is required']"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Click to select birth date"
                    class="form-input"
                    style="cursor: pointer;"
                  ></v-text-field>
                  
                  <v-dialog v-model="birthdateMenu" width="auto" :z-index="999999">
                    <v-date-picker 
                      v-model="birthdateDateVal" 
                      @update:model-value="updateBirthdate" 
                      :max="maxDate"
                      show-adjacent-months 
                      header="Select Birth Date"
                    ></v-date-picker>
                  </v-dialog>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Highest Educational Attainment: <span class="required">*</span></label>
                  <v-select
                    v-model="formData.educationalAttainment"
                    :items="educationLevels"
                    :rules="[v => !!v || 'Education level is required']"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Select Education"
                    class="form-input"
                  ></v-select>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- STEP 1: Address & Location Pinning -->
          <div v-show="currentStep === 1" class="step-content">
            <h3 class="step-title">Home Location Map Pinning</h3>
            <p class="step-subtitle">Drag or click on the map to pin the home coordinates. It automatically populates the address.</p>
            
            <!-- Search bar for Map Location Pinning -->
            <div class="map-search-bar mb-3">
              <v-text-field
                v-model="mapSearchQuery"
                append-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                placeholder="Search location (e.g. Naga City Hall, UNC)..."
                hide-details
                @click:append-inner="searchLocation"
                @keyup.enter="searchLocation"
                class="form-input"
              ></v-text-field>
            </div>
            
            <div id="admin-map" class="leaflet-map-container mb-4"></div>
            
            <v-row>
              <v-col cols="12">
                <div class="form-group">
                  <label class="form-label">Mailing Address: <span class="required">*</span></label>
                  <v-text-field
                    v-model="formData.address"
                    :rules="addressRules"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Mailing Address (auto-populates on map pin)"
                    class="form-input"
                  ></v-text-field>
                </div>
              </v-col>
              
              <v-col cols="12" md="6" class="py-0">
                <div class="coord-badge">
                  <strong>Latitude:</strong> {{ mapCoords.lat.toFixed(6) }}
                </div>
              </v-col>
              <v-col cols="12" md="6" class="py-0">
                <div class="coord-badge">
                  <strong>Longitude:</strong> {{ mapCoords.lng.toFixed(6) }}
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- STEP 2: Signature Drawing Canvas -->
          <div v-show="currentStep === 2" class="step-content">
            <h3 class="step-title">Signature Canvas</h3>
            <p class="step-subtitle">Have the applicant/stallholder sign directly on screen using a mouse or touch screen.</p>
            
            <div class="signature-canvas-outer mt-2">
              <canvas id="admin-sig-canvas" class="sig-canvas"></canvas>
              
              <div class="canvas-controls d-flex justify-space-between align-center mt-3">
                <v-btn color="error" variant="outlined" size="small" @click="clearSignature">
                  <v-icon start>mdi-eraser</v-icon> Clear Canvas
                </v-btn>
                <div class="canvas-status">
                  <v-chip v-if="signatureSaved" color="success" size="small">
                    <v-icon start>mdi-check-circle</v-icon> Signature Saved
                  </v-chip>
                  <v-chip v-else color="warning" size="small">
                    <v-icon start>mdi-alert-circle</v-icon> Pending Capture
                  </v-chip>
                </div>
                <v-btn color="success" size="small" @click="saveSignature">
                  <v-icon start>mdi-content-save</v-icon> Capture & Lock
                </v-btn>
              </div>
            </div>
          </div>

          <!-- STEP 3: Business Information -->
          <div v-show="currentStep === 3" class="step-content">
            <h3 class="step-title">Business Information</h3>
            <p class="step-subtitle">Provide applicant's planned capitalization and commercial credentials.</p>
            
            <v-row>
              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Business Name: <span class="required">*</span></label>
                  <v-text-field
                    v-model="formData.businessName"
                    :rules="[v => !!v || 'Business name is required']"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Planned business name"
                    class="form-input"
                  ></v-text-field>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Capitalization Amount (PHP): <span class="required">*</span></label>
                  <v-text-field
                    v-model="formData.capitalization"
                    type="number"
                    :rules="[v => !!v || 'Capitalization is required', v => v > 0 || 'Must be greater than 0']"
                    variant="outlined"
                    density="comfortable"
                    placeholder="e.g. 50000"
                    class="form-input"
                  ></v-text-field>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Source of Capital: <span class="required">*</span></label>
                  <v-select
                    v-model="formData.sourceOfCapital"
                    :items="capitalTypes"
                    :rules="[v => !!v || 'Source of capital is required']"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Please select source of capital"
                    class="form-input"
                  ></v-select>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Relative is a Stall Owner? <span class="required">*</span></label>
                  <v-select
                    v-model="formData.relativeStallOwner"
                    :items="['Yes', 'No']"
                    :rules="[v => !!v || 'Please select option']"
                    variant="outlined"
                    density="comfortable"
                    class="form-input"
                  ></v-select>
                </div>
              </v-col>

              <v-col cols="12">
                <div class="form-group">
                  <label class="form-label">Previous Business Experience:</label>
                  <v-textarea
                    v-model="formData.previousExperience"
                    variant="outlined"
                    rows="3"
                    placeholder="Describe any previous retail or enterprise experience"
                    class="form-input"
                  ></v-textarea>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- STEP 4: Spouse Information (Optional) -->
          <div v-show="currentStep === 4" class="step-content">
            <h3 class="step-title">Spouse Information</h3>
            <p class="step-subtitle">Enter details about the spouse if married (leave blank if single/not applicable).</p>
            
            <v-row>
              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Spouse Full Name:</label>
                  <v-text-field
                    v-model="formData.spouseName"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Last Name, First Name, Middle Name"
                    class="form-input"
                  ></v-text-field>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Spouse Birth Date:</label>
                  <v-text-field
                    :model-value="formattedSpouseBirthdate"
                    readonly
                    @click="spouseBirthdateMenu = true"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Click to select birth date"
                    class="form-input"
                    style="cursor: pointer;"
                  ></v-text-field>
                  
                  <v-dialog v-model="spouseBirthdateMenu" width="auto" :z-index="999999">
                    <v-date-picker 
                      v-model="spouseBirthdateDateVal" 
                      @update:model-value="updateSpouseBirthdate" 
                      :max="maxDate"
                      show-adjacent-months 
                      header="Select Spouse Birth Date"
                    ></v-date-picker>
                  </v-dialog>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Spouse Contact Number:</label>
                  <v-text-field
                    v-model="formData.spouseContact"
                    variant="outlined"
                    density="comfortable"
                    placeholder="09XXXXXXXXX"
                    class="form-input"
                  ></v-text-field>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Spouse Occupation:</label>
                  <v-text-field
                    v-model="formData.spouseOccupation"
                    variant="outlined"
                    density="comfortable"
                    placeholder="e.g. Teacher, Business Person"
                    class="form-input"
                  ></v-text-field>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Spouse Educational Attainment:</label>
                  <v-select
                    v-model="formData.spouseEducation"
                    :items="educationLevels"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Select spouse education"
                    class="form-input"
                  ></v-select>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- STEP 5: Stall Allocation & Contract -->
          <div v-show="currentStep === 5" class="step-content">
            <h3 class="step-title">Stall Allocation & Contract details</h3>
            <p class="step-subtitle">Assign an available stall and configure lease contract settings.</p>
            
            <v-row>
              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Assign Stall: <span class="required">*</span></label>
                  <v-select
                    v-model="formData.stallId"
                    :items="availableStalls"
                    item-title="stall_label"
                    item-value="stall_id"
                    :rules="[v => !!v || 'Please select a stall']"
                    :loading="loadingStalls"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Choose an active available stall"
                    class="form-input"
                    @update:model-value="onStallSelected"
                  ></v-select>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Monthly Rent Amount (PHP): <span class="required">*</span></label>
                  <v-text-field
                    v-model="formData.monthlyRent"
                    type="number"
                    :rules="[v => !!v || 'Monthly rent is required', v => v > 0 || 'Must be greater than 0']"
                    :readonly="isRentReadOnly"
                    variant="outlined"
                    density="comfortable"
                    class="form-input"
                  ></v-text-field>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Contract Start Date: <span class="required">*</span></label>
                  <v-text-field
                    :model-value="formattedContractStartDate"
                    readonly
                    @click="contractStartMenu = true"
                    :rules="[v => !!v || 'Contract start is required']"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Click to select start date"
                    class="form-input"
                    style="cursor: pointer;"
                  ></v-text-field>
                  
                  <v-dialog v-model="contractStartMenu" width="auto" :z-index="999999">
                    <v-date-picker 
                      v-model="contractStartDateVal" 
                      @update:model-value="updateContractStartDate" 
                      show-adjacent-months 
                      header="Select Start Date"
                    ></v-date-picker>
                  </v-dialog>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="form-group">
                  <label class="form-label">Contract End Date: <span class="required">*</span></label>
                  <v-text-field
                    :model-value="formattedContractEndDate"
                    readonly
                    @click="contractEndMenu = true"
                    :rules="[v => !!v || 'Contract end is required']"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Click to select end date"
                    class="form-input"
                    style="cursor: pointer;"
                  ></v-text-field>
                  
                  <v-dialog v-model="contractEndMenu" width="auto" :z-index="999999">
                    <v-date-picker 
                      v-model="contractEndDateVal" 
                      @update:model-value="updateContractEndDate" 
                      show-adjacent-months 
                      header="Select End Date"
                    ></v-date-picker>
                  </v-dialog>
                </div>
              </v-col>

              <v-col cols="12">
                <div class="form-group">
                  <label class="form-label">Contract Notes:</label>
                  <v-textarea
                    v-model="formData.notes"
                    variant="outlined"
                    rows="3"
                    placeholder="Enter any additional lease conditions or notes"
                    class="form-input"
                  ></v-textarea>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- STEP 6: Account Credentials & Email -->
          <div v-show="currentStep === 6" class="step-content">
            <h3 class="step-title">Account & Welcome Email</h3>
            <p class="step-subtitle">Set up the credentials delivery email. System will auto-generate username/password.</p>
            
            <v-row>
              <v-col cols="12">
                <div class="form-group">
                  <label class="form-label">Stallholder Email Address: <span class="required">*</span></label>
                  <v-text-field
                    v-model="formData.email"
                    :rules="emailRules"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Enter valid email where login credentials will be sent"
                    class="form-input"
                  ></v-text-field>
                </div>
              </v-col>
            </v-row>

            <v-card variant="flat" color="blue-lighten-5" class="mt-4 pa-4 credentials-preview-card">
              <div class="d-flex align-center">
                <v-icon color="primary" class="mr-3" size="32">mdi-email-alert</v-icon>
                <div>
                  <h4 class="text-primary font-weight-bold">Automatic Credentials Generator</h4>
                  <p class="text-body-2 text-grey-darken-2 mb-0">
                    On submission, the system will atomically create an auto-approved application, occupying the assigned stall, hashing generated passwords securely, and emailing a welcome kit containing plain-text credentials to the stallholder.
                  </p>
                </div>
              </div>
            </v-card>
          </div>

        </v-form>
      </v-card-text>

      <!-- Footer Buttons -->
      <v-card-actions class="modal-footer d-flex justify-space-between align-center px-6 py-4">
        <v-btn 
          variant="outlined"
          color="grey-darken-1"
          @click="prevStep"
          :disabled="currentStep === 0 || isSubmitting"
          class="nav-btn"
        >
          <v-icon start>mdi-arrow-left</v-icon> BACK
        </v-btn>
        
        <div class="nav-dots">
          <span 
            v-for="(step, idx) in visibleSteps" 
            :key="step.index" 
            class="dot-indicator" 
            :class="{ 'active': currentStep === step.index }"
          ></span>
        </div>

        <v-btn 
          v-if="currentStep < steps.length - 1"
          color="primary"
          @click="nextStep"
          class="nav-btn submit-btn"
        >
          NEXT <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
        <v-btn 
          v-else
          color="success"
          :disabled="!isFormValid || isSubmitting"
          :loading="isSubmitting"
          @click="submitForm"
          class="nav-btn submit-btn"
        >
          FINISH & CREATE <v-icon end>mdi-check-all</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Premium Snackbar Notification -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="bottom left"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2" size="20" color="white">
          {{ snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
        </v-icon>
        <span class="text-white font-weight-medium">{{ snackbar.message }}</span>
      </div>
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          size="small"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-dialog>
</template>

<script src="./AddStallholder.js"></script>
<style scoped src="./AddStallholder.css"></style>
