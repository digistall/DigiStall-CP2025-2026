<template>
  <v-dialog v-model="isVisible" max-width="900px" persistent>
    <v-card>
      <v-toolbar color="primary" dark dense>
        <v-toolbar-title class="toolbar-title">
          <v-icon left>mdi-file-document-edit-outline</v-icon>
          Document Requirements Configuration
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0">
        <v-container fluid>
          <!-- Document Types Configuration -->
          <v-divider></v-divider>
          
          <div class="pa-4">
            <div class="config-section">
              <div class="section-header">
                <h3 class="section-title">
                  <v-icon left color="primary">mdi-file-document-multiple-outline</v-icon>
                  Required Documents Configuration
                </h3>
                <v-btn 
                  color="success" 
                  small 
                  @click="addNewDocumentType"
                  class="add-doc-btn"
                >
                  <v-icon left small>mdi-plus</v-icon>
                  Add Document Requirement
                </v-btn>
              </div>

              <!-- Loading State -->
              <v-progress-linear 
                v-if="loading" 
                indeterminate 
                color="primary"
                class="mb-4"
              ></v-progress-linear>

              <!-- Document Requirements List -->
              <div v-if="!loading" class="requirements-list">
                <v-expansion-panels v-model="expandedPanels" multiple accordion>
                  <v-expansion-panel 
                    v-for="docType in documentTypes" 
                    :key="docType.document_type_id"
                    class="requirement-panel"
                  >
                    <v-expansion-panel-title>
                      <div class="panel-header">
                        <div class="doc-type-info">
                          <v-icon left :color="docType.is_required ? 'error' : 'warning'">
                            {{ docType.is_required ? 'mdi-file-document-alert' : 'mdi-file-document' }}
                          </v-icon>
                          <span class="doc-name">{{ docType.document_name }}</span>
                          <v-chip 
                            :color="docType.is_required ? 'error' : 'orange'" 
                            small 
                            text-color="white"
                            class="ml-2"
                          >
                            {{ docType.is_required ? 'Required' : 'Optional' }}
                          </v-chip>
                        </div>
                        <div class="doc-actions">
                          <v-tooltip text="Remove Document">
                            <template v-slot:activator="{ props }">
                              <v-btn 
                                icon 
                                size="small"
                                color="error"
                                v-bind="props"
                                @click.stop="confirmDeleteDocumentType(docType)"
                              >
                                <v-icon>mdi-delete</v-icon>
                              </v-btn>
                            </template>
                          </v-tooltip>
                        </div>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div class="panel-content">
                        <v-row>
                          <v-col cols="12" md="6">
                            <v-text-field
                              :value="docType.document_name"
                              label="Document Name"
                              outlined
                              dense
                              readonly
                              hint="Predefined document type"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="12" md="6">
                            <v-switch
                              v-model="docType.is_required"
                              :label="docType.is_required ? 'Required Document' : 'Optional Document'"
                              color="primary"
                              @change="updateDocumentRequirement(docType)"
                            ></v-switch>
                          </v-col>
                        </v-row>
                        <v-row>
                          <v-col cols="12" md="6">
                            <v-textarea
                              :value="docType.description"
                              label="Document Description"
                              outlined
                              dense
                              rows="2"
                              readonly
                              hint="Standard description for this document type"
                            ></v-textarea>
                          </v-col>
                          <v-col cols="12" md="6">
                            <v-textarea
                              v-model="docType.instructions"
                              label="Special Instructions"
                              outlined
                              dense
                              rows="2"
                              @change="updateDocumentRequirement(docType)"
                              hint="Add specific instructions for this branch"
                            ></v-textarea>
                          </v-col>
                        </v-row>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <!-- Empty State -->
                <div v-if="documentTypes.length === 0" class="empty-state">
                  <v-icon size="64" color="grey lighten-2">mdi-file-document-plus-outline</v-icon>
                  <h3>No Document Requirements Set</h3>
                  <p>Add document types that stallholder applicants need to submit for this branch.</p>
                  <v-btn color="primary" @click="addNewDocumentType">
                    <v-icon left>mdi-plus</v-icon>
                    Add First Document Requirement
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </v-container>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="px-6 py-4">
        <v-btn color="grey" text @click="closeDialog">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          @click="saveAllChanges" 
          :loading="saving"
          :disabled="!hasChanges"
        >
          <v-icon left>mdi-content-save</v-icon>
          Save All Changes
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Add Document Type Dialog -->
    <v-dialog v-model="showDocTypeDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">
          <v-icon left>mdi-file-document-plus</v-icon>
          Add Document Requirement
        </v-card-title>
        <v-card-text>
          <v-form ref="docTypeForm" v-model="docTypeFormValid">
            <v-select
              v-model="selectedDocumentTypeId"
              :items="availableDocumentTypes.filter(type => 
                !branchRequirements.find(req => req.document_type_id === type.document_type_id)
              )"
              item-title="document_name"
              item-value="document_type_id"
              label="Select Document Type *"
              :rules="[v => !!v || 'Document type is required']"
              outlined
              dense
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="item.raw.document_name" :subtitle="item.raw.description"></v-list-item>
              </template>
            </v-select>
            <v-textarea
              v-model="selectedInstructions"
              label="Special Instructions"
              outlined
              dense
              rows="3"
              hint="Optional: Add any special instructions for this document requirement"
            ></v-textarea>
            <v-switch
              v-model="selectedRequiredStatus"
              label="This document is required"
              color="primary"
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="grey" text @click="cancelDocTypeDialog">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn 
            color="primary" 
            @click="saveDocumentType"
            :disabled="!docTypeFormValid"
            :loading="savingDocType"
          >
            Add Requirement
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="headline error--text">
          <v-icon left color="error">mdi-alert-circle</v-icon>
          Confirm Delete
        </v-card-title>
        <v-card-text>
          Are you sure you want to remove <strong>{{ docTypeToDelete?.document_name }}</strong> from the requirements? 
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-btn color="grey" text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="deleteDocumentType" :loading="deleting">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="showSuccess"
      color="success"
      timeout="3000"
      bottom
    >
      <v-icon left>mdi-check-circle</v-icon>
      {{ successMessage }}
    </v-snackbar>

    <!-- Error Snackbar -->
    <v-snackbar
      v-model="showError"
      color="error"
      timeout="5000"
      bottom
    >
      <v-icon left>mdi-alert-circle</v-icon>
      {{ errorMessage }}
    </v-snackbar>
  </v-dialog>
</template>

<script src="./DocumentCustomization.js"></script>
<style scoped src="./DocumentCustomization.css"></style>