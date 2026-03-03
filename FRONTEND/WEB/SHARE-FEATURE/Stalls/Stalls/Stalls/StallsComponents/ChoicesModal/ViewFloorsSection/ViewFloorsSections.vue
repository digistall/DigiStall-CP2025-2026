<template>
    <div>
        <!-- View Floors & Sections Modal -->
        <v-dialog v-model="showModal" max-width="1000px" width="95vw" persistent scrollable>
            <v-card class="view-modal-card">
                <v-card-title class="view-modal-header">
                    <span>Floors & Sections Overview</span>
                    <v-btn icon rounded @click="closeModal" color="white">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>

                <v-card-text class="pa-0">
                    <!-- Search and Filter Bar -->
                    <div class="search-filter-bar pa-6 pb-4">
                        <v-row>
                            <v-col cols="12" md="8">
                                <v-text-field v-model="searchQuery" label="Search floors or sections..."
                                    prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" clearable
                                    hide-details />
                            </v-col>
                            <v-col cols="12" md="4">
                                <v-select v-model="selectedFilter" :items="filterOptions" label="Filter by"
                                    variant="outlined" density="compact" hide-details />
                            </v-col>
                        </v-row>
                    </div>

                    <!-- Content Area -->
                    <div class="content-area" style="max-height: 60vh; overflow-y: auto;">
                        <!-- Loading State -->
                        <div v-if="loading" class="loading-container pa-8">
                            <div class="text-center">
                                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                                <p class="mt-4 text-h6">Loading floors and sections...</p>
                            </div>
                        </div>

                        <!-- Empty State -->
                        <div v-else-if="filteredFloors.length === 0" class="empty-state pa-8">
                            <div class="text-center">
                                <v-icon size="120" color="grey lighten-1">mdi-domain-off</v-icon>
                                <h3 class="mt-4 mb-2">No Floors or Sections Found</h3>
                                <p class="text-body-1 grey--text">
                                    {{ searchQuery ? 'No results match your search criteria.' : 'You haven\'t created any floors or sections yet.' }}
                                </p>
                                <v-btn v-if="!searchQuery" color="primary" class="mt-4" @click="goToAddFloorSection">
                                    <v-icon left>mdi-plus</v-icon>
                                    Create First Floor
                                </v-btn>
                            </div>
                        </div>

                        <!-- Floors List -->
                        <div v-else class="floors-list pa-4">
                            <div v-for="floor in filteredFloors" :key="floor.id" class="floor-item mb-4">
                                <v-card class="floor-card" elevation="2">
                                    <v-card-title class="floor-header">
                                        <div class="d-flex align-center justify-space-between w-100">
                                            <div class="d-flex align-center">
                                                <v-icon color="primary" class="mr-3">mdi-domain</v-icon>
                                                <div>
                                                    <h4>{{ floor.name }}</h4>
                                                    <p class="text-caption grey--text mb-0">
                                                        {{ floor.sections?.length || 0 }} sections
                                                    </p>
                                                </div>
                                            </div>
                                            <div class="floor-actions d-flex align-center ga-1">
                                                <v-btn icon size="small" color="primary" variant="text" @click="editFloor(floor)" title="Edit Floor">
                                                    <v-icon size="small">mdi-pencil</v-icon>
                                                </v-btn>
                                                <v-btn icon size="small" color="error" variant="text" @click="confirmDeleteFloor(floor)" title="Delete Floor">
                                                    <v-icon size="small">mdi-delete</v-icon>
                                                </v-btn>
                                                <v-btn icon size="small" @click="toggleFloorExpansion(floor.id)"
                                                    :color="expandedFloors.includes(floor.id) ? 'primary' : 'grey'">
                                                    <v-icon>
                                                        {{ expandedFloors.includes(floor.id) ? 'mdi-chevron-up' :
                                                            'mdi-chevron-down' }}
                                                    </v-icon>
                                                </v-btn>
                                            </div>
                                        </div>
                                    </v-card-title>

                                    <!-- Sections List (Expandable) -->
                                    <v-expand-transition>
                                        <div v-show="expandedFloors.includes(floor.id)" class="sections-container">
                                            <v-divider></v-divider>
                                            <div v-if="floor.sections && floor.sections.length > 0"
                                                class="sections-list pa-4">
                                                <h5 class="mb-3 text-subtitle-1">Sections:</h5>
                                                <v-row dense>
                                                    <v-col v-for="section in floor.sections" :key="section.id" cols="12"
                                                        sm="6" md="4">
                                                        <v-card class="section-card" variant="outlined">
                                                            <v-card-text class="pa-3">
                                                                <div class="d-flex align-center justify-space-between">
                                                                    <div class="d-flex align-center">
                                                                        <v-icon color="primary"
                                                                            class="mr-2">mdi-view-grid</v-icon>
                                                                        <div>
                                                                            <p class="font-weight-medium mb-1">{{
                                                                                section.name }}</p>
                                                                            <p class="text-caption grey--text mb-0">
                                                                                {{ section.stall_count || 0 }} stalls
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div class="section-actions">
                                                                        <v-btn icon size="x-small" color="primary" variant="text" @click="editSection(section, floor)" title="Edit Section">
                                                                            <v-icon size="small">mdi-pencil</v-icon>
                                                                        </v-btn>
                                                                        <v-btn icon size="x-small" color="error" variant="text" @click="confirmDeleteSection(section, floor)" title="Delete Section">
                                                                            <v-icon size="small">mdi-delete</v-icon>
                                                                        </v-btn>
                                                                    </div>
                                                                </div>
                                                            </v-card-text>
                                                        </v-card>
                                                    </v-col>
                                                </v-row>
                                            </div>
                                            <div v-else class="no-sections pa-4">
                                                <p class="text-center grey--text">No sections in this floor yet.</p>
                                            </div>
                                        </div>
                                    </v-expand-transition>
                                </v-card>
                            </div>
                        </div>
                    </div>
                </v-card-text>

                <v-card-actions class="pa-6">
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="outlined" @click="closeModal">
                        Close
                    </v-btn>
                    <v-btn color="primary" @click="goToAddFloorSection">
                        <v-icon left>mdi-plus</v-icon>
                        Add New
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Edit Dialog -->
        <v-dialog v-model="editDialog" max-width="500px">
            <v-card>
                <v-card-title class="text-h6 bg-primary text-white pa-4">
                    Edit {{ editType === 'floor' ? 'Floor' : 'Section' }}
                </v-card-title>
                <v-card-text class="pa-4">
                    <v-text-field
                        v-model="editForm.name"
                        :label="editType === 'floor' ? 'Floor Name' : 'Section Name'"
                        variant="outlined"
                        density="compact"
                        class="mb-3"
                    />
                    <v-textarea
                        v-model="editForm.description"
                        label="Description (Optional)"
                        variant="outlined"
                        density="compact"
                        rows="3"
                    />
                </v-card-text>
                <v-card-actions class="pa-4">
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="outlined" @click="editDialog = false">Cancel</v-btn>
                    <v-btn color="primary" @click="saveEdit">Save Changes</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteDialog" max-width="450px">
            <v-card>
                <v-card-title class="text-h6 bg-error text-white pa-4">
                    <v-icon class="mr-2">mdi-alert</v-icon>
                    Confirm Delete
                </v-card-title>
                <v-card-text class="pa-4">
                    <p class="text-body-1">
                        Are you sure you want to delete this {{ deleteType }}?
                    </p>
                    <p v-if="deleteItem" class="font-weight-bold text-h6 mt-2">
                        "{{ deleteItem.name }}"
                    </p>
                    <p class="text-caption text-error mt-2">
                        <v-icon size="small" color="error">mdi-information</v-icon>
                        This action cannot be undone.
                    </p>
                </v-card-text>
                <v-card-actions class="pa-4">
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="outlined" @click="deleteDialog = false">Cancel</v-btn>
                    <v-btn color="error" @click="deleteItem_">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Snackbar for notifications -->
        <v-snackbar
            v-model="snackbar.show"
            :timeout="4000"
            location="bottom left"
            :content-class="'white-snackbar-content'"
            :style="{ '--v-snackbar-background': '#ffffff' }"
            :class="['custom-snackbar', snackbar.color === 'success' ? 'success-snackbar' : 'error-snackbar']"
        >
            <div class="d-flex align-center" :class="snackbar.color === 'success' ? 'success-content' : 'error-content'" style="background-color: #ffffff;">
                <v-icon class="mr-2" :style="{ color: snackbar.color === 'success' ? '#4caf50' : '#f44336' }">
                    {{ snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                </v-icon>
                <span :style="{ color: snackbar.color === 'success' ? '#2e7d32' : '#c62828', fontWeight: 500 }">
                    {{ snackbar.message }}
                </span>
            </div>
            <template v-slot:actions>
                <v-btn variant="text" :style="{ color: snackbar.color === 'success' ? '#4caf50' : '#f44336' }" @click="snackbar.show = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>

<script src="./ViewFloorsSections.js"></script>
<style scoped src="./ViewFloorsSections.css"></style>
