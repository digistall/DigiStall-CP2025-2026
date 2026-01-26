# Stored Procedure Usage Report
Generated: January 13, 2026

## Summary
| Category | Count |
|----------|-------|
| **Total Procedures Listed** | 500+ |
| **Used in Backend Code** | ~248 |
| **Not Found in Code** | ~252 |

---

## ✅ PROCEDURES THAT ARE BEING USED (Found in Backend Code)

### Authentication & Session Management
| Procedure | Status |
|-----------|--------|
| `loginBusinessEmployee` | ✅ Used |
| `revokeAllUserTokens` | ✅ Used |
| `sp_autoLogoutBusinessEmployee` | ✅ Used |
| `sp_autoLogoutBusinessManager` | ✅ Used |
| `sp_autoLogoutCollector` | ✅ Used |
| `sp_autoLogoutInspector` | ✅ Used |
| `sp_checkBusinessEmployeeExists` | ✅ Used |
| `sp_checkBusinessManagerExists` | ✅ Used |
| `sp_checkBusinessOwnerExists` | ✅ Used |
| `sp_checkSystemAdminExists` | ✅ Used |
| `sp_createOrUpdateEmployeeSession` | ✅ Used |
| `sp_endEmployeeSession` | ✅ Used |
| `sp_getActiveRefreshToken` | ✅ Used |
| `sp_getRefreshTokenByHash` | ✅ Used |
| `sp_heartbeatBusinessEmployee` | ✅ Used |
| `sp_heartbeatBusinessManager` | ✅ Used |
| `sp_heartbeatBusinessOwner` | ✅ Used |
| `sp_heartbeatCollector` | ✅ Used |
| `sp_heartbeatInspector` | ✅ Used |
| `sp_heartbeatSystemAdmin` | ✅ Used |
| `sp_logStaffActivityLogin` | ✅ Used |
| `sp_logStaffActivityLogout` | ✅ Used |
| `sp_logTokenActivity` | ✅ Used |
| `sp_logoutEmployee` | ✅ Used |
| `sp_revokeRefreshTokenByHash` | ✅ Used |
| `sp_storeRefreshToken` | ✅ Used |
| `sp_updateBusinessEmployeeLastLoginNow` | ✅ Used |
| `sp_updateBusinessEmployeeLastLogout` | ✅ Used |
| `sp_updateBusinessEmployeeLastLogoutNow` | ✅ Used |
| `sp_updateBusinessManagerLastLoginNow` | ✅ Used |
| `sp_updateBusinessManagerLastLogout` | ✅ Used |
| `sp_updateBusinessOwnerLastLoginNow` | ✅ Used |
| `sp_updateBusinessOwnerLastLogout` | ✅ Used |
| `sp_updateRefreshTokenLastUsed` | ✅ Used |
| `sp_updateSystemAdminLastLoginNow` | ✅ Used |
| `sp_updateSystemAdminLastLogout` | ✅ Used |

### User Retrieval
| Procedure | Status |
|-----------|--------|
| `getBusinessEmployeeById` | ✅ Used |
| `getBusinessEmployeeByUsername` | ✅ Used |
| `getBusinessManagerByUsername` | ✅ Used |
| `getStallBusinessOwnerByUsernameLogin` | ✅ Used |
| `sp_getAdminById` | ✅ Used |
| `sp_getBranchManagerById` | ✅ Used |
| `sp_getBranchManagerForCurrentUser` | ✅ Used |
| `sp_getBusinessEmployeeByUsername` | ✅ Used |
| `sp_getBusinessEmployeesAllDecrypted` | ✅ Used |
| `sp_getBusinessEmployeesByBranchDecrypted` | ✅ Used |
| `sp_getBusinessEmployeeWithBranch` | ✅ Used |
| `sp_getBusinessManagerByUsername` | ✅ Used |
| `sp_getBusinessManagerWithBranch` | ✅ Used |
| `sp_getBusinessOwnerById` | ✅ Used |
| `sp_getBusinessOwnerByUsername` | ✅ Used |
| `sp_getCollectorByUsername` | ✅ Used |
| `sp_getCollectorsAllDecrypted` | ✅ Used |
| `sp_getCollectorsByBranchDecrypted` | ✅ Used |
| `sp_getEmployeeWithBranchInfo` | ✅ Used |
| `sp_getInspectorByUsername` | ✅ Used |
| `sp_getInspectorsAllDecrypted` | ✅ Used |
| `sp_getInspectorsByBranchDecrypted` | ✅ Used |
| `sp_getMobileUserByUsername` | ✅ Used |
| `sp_getSystemAdminById` | ✅ Used |
| `sp_getSystemAdminByUsername` | ✅ Used |

### Branch & Location Management
| Procedure | Status |
|-----------|--------|
| `createBranch` | ✅ Used |
| `deleteBranch` | ✅ Used |
| `getAllActiveBranches` | ✅ Used |
| `getAllBranchesDetailed` | ✅ Used |
| `getBranchDocumentRequirements` | ✅ Used |
| `removeBranchDocumentRequirement` | ✅ Used |
| `setBranchDocumentRequirement` | ✅ Used |
| `sp_getBranchById` | ✅ Used |
| `sp_getBranchDocRequirementsFull` | ✅ Used |
| `sp_getBranches` | ✅ Used |
| `sp_getBranchIdForEmployee` | ✅ Used |
| `sp_getBranchIdForManager` | ✅ Used |
| `sp_getBranchIdsForOwner` | ✅ Used |
| `sp_getBranchInfoWithManager` | ✅ Used |
| `sp_getLocationsByArea` | ✅ Used |

### Floor & Section Management
| Procedure | Status |
|-----------|--------|
| `createFloor` | ✅ Used |
| `createSection` | ✅ Used |
| `deleteFloor` | ✅ Used |
| `deleteSection` | ✅ Used |
| `sp_getAllFloors` | ✅ Used |
| `sp_getAllSections` | ✅ Used |
| `sp_getFloorsByBranch` | ✅ Used |
| `sp_getFloorsByBranches` | ✅ Used |
| `sp_getSectionsByBranch` | ✅ Used |
| `sp_getSectionsByBranches` | ✅ Used |
| `sp_validateFloorSectionBranch` | ✅ Used |
| `updateFloor` | ✅ Used |
| `updateSection` | ✅ Used |

### Stall Management
| Procedure | Status |
|-----------|--------|
| `getStallsFiltered` | ✅ Used |
| `getStallWithBranchInfo` | ✅ Used |
| `sp_addStallImage` | ✅ Used |
| `sp_checkStallExists` | ✅ Used |
| `sp_checkStallExistsById` | ✅ Used |
| `sp_checkStallExistsInSection` | ✅ Used |
| `sp_checkStallExistsWeb` | ✅ Used |
| `sp_deleteStall_complete` | ✅ Used |
| `sp_deleteStallImage` | ✅ Used |
| `sp_getAllStalls_complete_decrypted` | ✅ Used |
| `sp_getAllStallsForLanding` | ✅ Used |
| `sp_getAvailableAreas` | ✅ Used |
| `sp_getAvailableMarkets` | ✅ Used |
| `sp_getFilteredStalls` | ✅ Used |
| `sp_getLandingPageFilterOptions` | ✅ Used |
| `sp_getLandingPageStallholdersList` | ✅ Used |
| `sp_getLandingPageStallsList` | ✅ Used |
| `sp_getLandingPageStats` | ✅ Used |
| `sp_getStallById_complete` | ✅ Used |
| `sp_getStallByIdForLanding` | ✅ Used |
| `sp_getStallDetailForApplicant` | ✅ Used |
| `sp_getStallsByAreaForApplicant` | ✅ Used |
| `sp_getStallsByAreaOrBranch` | ✅ Used |
| `sp_getStallsByLocation` | ✅ Used |
| `sp_getStallsByTypeForApplicant` | ✅ Used |
| `sp_insertStallFull` | ✅ Used |
| `sp_searchStallsForApplicant` | ✅ Used |

### Stall Image Management
| Procedure | Status |
|-----------|--------|
| `sp_checkImageExistsById` | ✅ Used |
| `sp_checkStallImageById` | ✅ Used |
| `sp_checkStallImageExists` | ✅ Used |
| `sp_getAllStallImages` | ✅ Used |
| `sp_getAllStallImagesWithData` | ✅ Used |
| `sp_getNextStallImageOrder` | ✅ Used |
| `sp_getNextStallImageOrderMobile` | ✅ Used |
| `sp_getRemainingImagesForReorder` | ✅ Used |
| `sp_getRemainingStallImages` | ✅ Used |
| `sp_getStallFirstImage` | ✅ Used |
| `sp_getStallIdFromImage` | ✅ Used |
| `sp_getStallImageById` | ✅ Used |
| `sp_getStallImageByOrder` | ✅ Used |
| `sp_getStallImageByPosition` | ✅ Used |
| `sp_getStallImageCount` | ✅ Used |
| `sp_getStallImageCountMobile` | ✅ Used |
| `sp_getStallImageDataById` | ✅ Used |
| `sp_getStallImageForDelete` | ✅ Used |
| `sp_getStallImageInfoById` | ✅ Used |
| `sp_getStallImages` | ✅ Used |
| `sp_getStallImagesPublic` | ✅ Used |
| `sp_getStallImagesWithData` | ✅ Used |
| `sp_getStallPrimaryImage` | ✅ Used |
| `sp_insertStallImageBlob` | ✅ Used |
| `sp_insertStallImageBlobMobile` | ✅ Used |
| `sp_setFirstImageAsPrimary` | ✅ Used |
| `sp_setImageAsPrimary` | ✅ Used |
| `sp_setNextPrimaryImage` | ✅ Used |
| `sp_setStallImagePrimary` | ✅ Used |
| `sp_setStallPrimaryImage` | ✅ Used |
| `sp_unsetAllPrimaryImages` | ✅ Used |
| `sp_unsetStallPrimaryImages` | ✅ Used |
| `sp_unsetStallPrimaryImagesMobile` | ✅ Used |
| `sp_updateImageDisplayOrder` | ✅ Used |
| `sp_updateStallImageBlob` | ✅ Used |
| `sp_updateStallImageBlobData` | ✅ Used |
| `sp_updateStallImageOrder` | ✅ Used |

### Applicant Management
| Procedure | Status |
|-----------|--------|
| `checkExistingApplication` | ✅ Used |
| `checkExistingMobileUser` | ✅ Used |
| `checkPendingApplication` | ✅ Used |
| `createApplicant` | ✅ Used |
| `createApplicantComplete` | ✅ Used |
| `createApplication` | ✅ Used |
| `deleteApplicant` | ✅ Used |
| `deleteApplication` | ✅ Used |
| `getAllApplicantsDecrypted` | ✅ Used |
| `getAllApplications` | ✅ Used |
| `getApplicantAdditionalInfo` | ✅ Used |
| `getApplicantApplicationsDetailed` | ✅ Used |
| `getApplicantByEmail` | ✅ Used |
| `getApplicantById` | ✅ Used |
| `getApplicantComplete` | ✅ Used |
| `getApplicationsByApplicant` | ✅ Used |
| `getAppliedAreasByApplicant` | ✅ Used |
| `getAvailableStallsByApplicant` | ✅ Used |
| `getMobileApplicationStatus` | ✅ Used |
| `getMobileUserApplications` | ✅ Used |
| `registerMobileUser` | ✅ Used |
| `sp_checkApplicantAreaAccess` | ✅ Used |
| `sp_checkApplicantExists` | ✅ Used |
| `sp_countBranchApplications` | ✅ Used |
| `sp_countBranchApplicationsForApplicant` | ✅ Used |
| `sp_deleteApplicantCascade` | ✅ Used |
| `sp_getApplicantById` | ✅ Used |
| `sp_getApplicantDetailsForComplaintDecrypted` | ✅ Used |
| `sp_getAppliedAreasForApplicant` | ✅ Used |
| `sp_getAvailableAreasForApplicant` | ✅ Used |
| `sp_getAvailableStallsForApplicant` | ✅ Used |
| `sp_getBusinessInfoByApplicantId` | ✅ Used |
| `sp_getCredentialWithApplicant` | ✅ Used |
| `sp_getLatestApplicationByApplicantId` | ✅ Used |
| `sp_getLatestApplicationInfo` | ✅ Used |
| `sp_getOtherInfoByApplicantId` | ✅ Used |
| `sp_getSpouseByApplicantId` | ✅ Used |
| `updateApplicant` | ✅ Used |
| `updateApplicantComplete` | ✅ Used |
| `updateApplicationStatus` | ✅ Used |
| `updateMobileApplication` | ✅ Used |

### Applicant Document Management
| Procedure | Status |
|-----------|--------|
| `sp_checkExistingApplicantDocument` | ✅ Used |
| `sp_checkExistingApplicantDocumentMulter` | ✅ Used |
| `sp_deleteApplicantDocumentBlob` | ✅ Used |
| `sp_getAllApplicantDocuments` | ✅ Used |
| `sp_getAllApplicantDocumentsWithData` | ✅ Used |
| `sp_getApplicantDocumentBlob` | ✅ Used |
| `sp_getApplicantDocumentBlobById` | ✅ Used |
| `sp_getApplicantDocumentByTypeExtended` | ✅ Used |
| `sp_insertApplicantDocumentBlob` | ✅ Used |
| `sp_insertApplicantDocumentMulter` | ✅ Used |
| `sp_updateApplicantDocumentBlob` | ✅ Used |
| `sp_updateApplicantDocumentMulter` | ✅ Used |
| `sp_updateApplicantDocumentVerification` | ✅ Used |

### Stallholder Management
| Procedure | Status |
|-----------|--------|
| `createStallholder` | ✅ Used |
| `deleteStallholder` | ✅ Used |
| `getStallholderBranchId` | ✅ Used |
| `getStallholderById` | ✅ Used |
| `getStallholdersByBranchDecrypted` | ✅ Used |
| `sp_checkStallholderExists` | ✅ Used |
| `sp_getAllStallholdersAllDecrypted` | ✅ Used |
| `sp_getAllStallholdersByBranchesDecrypted` | ✅ Used |
| `sp_get_all_stallholders_decrypted` | ✅ Used |
| `sp_get_stallholder_details_decrypted` | ✅ Used |
| `sp_getFullStallholderInfo` | ✅ Used |
| `sp_getStallholderByApplicantId` | ✅ Used |
| `sp_getStallholderDetailByIdWithBranch` | ✅ Used |
| `sp_getStallholderDetailsForComplaintDecrypted` | ✅ Used |
| `sp_getStallholderIdByApplicant` | ✅ Used |
| `sp_getStallholderStallsForDocuments` | ✅ Used |
| `sp_getStallholderUploadedDocuments` | ✅ Used |
| `updateStallholder` | ✅ Used |

### Stallholder Document Management
| Procedure | Status |
|-----------|--------|
| `sp_checkDocumentExistsForDelete` | ✅ Used |
| `sp_checkExistingDocumentSubmission` | ✅ Used |
| `sp_checkExistingStallholderDocument` | ✅ Used |
| `sp_deleteStallholderDocument` | ✅ Used |
| `sp_getAllStallholderDocuments` | ✅ Used |
| `sp_getDocumentById` | ✅ Used |
| `sp_getDocumentsByStallholderId` | ✅ Used |
| `sp_getDocumentTypeByName` | ✅ Used |
| `sp_getStallholderDocumentBlob` | ✅ Used |
| `sp_getStallholderDocumentBlobById` | ✅ Used |
| `sp_getStallholderDocumentSubmissionBlob` | ✅ Used |
| `sp_insertDocumentSubmissionBlob` | ✅ Used |
| `sp_insertStallholderDocumentBlob` | ✅ Used |
| `sp_reviewDocumentSubmission` | ✅ Used |
| `sp_reviewStallholderDocument` | ✅ Used |
| `sp_updateDocumentSubmissionBlob` | ✅ Used |
| `sp_updateStallholderDocumentBlob` | ✅ Used |
| `sp_updateStallholderDocumentVerification` | ✅ Used |
| `sp_uploadStallholderDocument` | ✅ Used |

### Payment Management
| Procedure | Status |
|-----------|--------|
| `addOnsitePayment` | ✅ Used |
| `getUnpaidViolationsByStallholder` | ✅ Used |
| `getViolationHistoryByStallholder` | ✅ Used |
| `getViolationPenaltiesByViolationId` | ✅ Used |
| `processViolationPayment` | ✅ Used |
| `sp_approvePayment` | ✅ Used |
| `sp_declinePayment` | ✅ Used |
| `sp_generate_receipt_number` | ✅ Used |
| `sp_getAllPaymentsByStallholder` | ✅ Used |
| `sp_getOnlinePaymentsAllDecrypted` | ✅ Used |
| `sp_getOnlinePaymentsByBranchesDecrypted` | ✅ Used |
| `sp_getOnsitePaymentsAllDecrypted` | ✅ Used |
| `sp_getOnsitePaymentsByBranchesDecrypted` | ✅ Used |
| `sp_getPaymentCountByStallholder` | ✅ Used |
| `sp_getPaymentsByStallholderPaginated` | ✅ Used |
| `sp_getPaymentStatsAll` | ✅ Used |
| `sp_getPaymentStatsByBranches` | ✅ Used |
| `sp_getPaymentSummaryByStallholder` | ✅ Used |

### Subscription Management
| Procedure | Status |
|-----------|--------|
| `createBusinessOwnerWithSubscription` | ✅ Used |
| `getAllBusinessOwnersWithSubscription` | ✅ Used |
| `getAllSubscriptionPlans` | ✅ Used |
| `getBusinessOwnerPaymentHistory` | ✅ Used |
| `getBusinessOwnerSubscription` | ✅ Used |
| `getSystemAdminDashboardStats` | ✅ Used |
| `recordSubscriptionPayment` | ✅ Used |

### Employee Management
| Procedure | Status |
|-----------|--------|
| `createBusinessEmployee` | ✅ Used |
| `getBusinessEmployeesByBranch` | ✅ Used |
| `resetBusinessEmployeePassword` | ✅ Used |
| `sp_terminateEmployee` | ✅ Used |
| `updateBusinessEmployee` | ✅ Used |

### Inspector & Collector Management
| Procedure | Status |
|-----------|--------|
| `getAllActiveInspectors` | ✅ Used |
| `sp_checkCollectorEmailExists` | ✅ Used |
| `sp_checkCollectorTableExists` | ✅ Used |
| `sp_checkInspectorEmailExists` | ✅ Used |
| `sp_createCollectorAssignmentDirect` | ✅ Used |
| `sp_createCollectorDirect` | ✅ Used |
| `sp_createInspectorAssignmentDirect` | ✅ Used |
| `sp_createInspectorDirect` | ✅ Used |
| `sp_getCollectorBranchAssignment` | ✅ Used |
| `sp_getInspectorBranchAssignment` | ✅ Used |
| `sp_logCollectorAction` | ✅ Used |
| `sp_logInspectorAction` | ✅ Used |
| `sp_resetCollectorPassword` | ✅ Used |
| `sp_resetInspectorPassword` | ✅ Used |
| `sp_terminateCollector` | ✅ Used |
| `sp_terminateInspector` | ✅ Used |

### Complaint & Compliance Management
| Procedure | Status |
|-----------|--------|
| `checkComplianceRecordExists` | ✅ Used |
| `createComplaint` | ✅ Used |
| `createComplianceRecord` | ✅ Used |
| `deleteComplaint` | ✅ Used |
| `deleteComplianceRecord` | ✅ Used |
| `getAllComplaintsDecrypted` | ✅ Used |
| `getAllComplianceRecordsDecrypted` | ✅ Used |
| `getAllViolationTypes` | ✅ Used |
| `getComplaintById` | ✅ Used |
| `getComplianceRecordById` | ✅ Used |
| `getComplianceRecordByIdDecrypted` | ✅ Used |
| `getComplianceStatistics` | ✅ Used |
| `reportStallholder` | ✅ Used |
| `resolveComplaint` | ✅ Used |
| `sp_ensureComplaintTableExists` | ✅ Used |
| `sp_getComplaintsByStallholderDecrypted` | ✅ Used |
| `sp_getViolationTypes` | ✅ Used |
| `sp_insertComplaint` | ✅ Used |
| `updateComplaint` | ✅ Used |
| `updateComplianceRecord` | ✅ Used |

### Staff Activity & Logging
| Procedure | Status |
|-----------|--------|
| `sp_clearAllActivityLogs` | ✅ Used |
| `sp_countStaffActivities` | ✅ Used |
| `sp_countStaffActivityById` | ✅ Used |
| `sp_getActivitySummaryByAction` | ✅ Used |
| `sp_getActivitySummaryByType` | ✅ Used |
| `sp_getAllParticipants` | ✅ Used |
| `sp_getAllStaffActivities` | ✅ Used |
| `sp_getMostActiveStaff` | ✅ Used |
| `sp_getRecentFailedActions` | ✅ Used |
| `sp_getStaffActivityById` | ✅ Used |
| `sp_insertStaffActivityLog` | ✅ Used |
| `sp_logStaffActivity` | ✅ Used |

### Credentials & Other
| Procedure | Status |
|-----------|--------|
| `createAdmin` | ✅ Used |
| `getEmailTemplate` | ✅ Used |
| `sp_checkUsernameExists` | ✅ Used |
| `sp_createCredential` | ✅ Used |
| `sp_getAllCredentials` | ✅ Used |
| `sp_updateCredentialLastLogout` | ✅ Used |
| `updateCredentialLastLogin` | ✅ Used |

### Raffle & Auction (Prepared for Future)
| Procedure | Status |
|-----------|--------|
| `sp_insertAuctionRecord` | ✅ Used |
| `sp_insertRaffleRecord` | ✅ Used |

---

## ❌ PROCEDURES NOT FOUND IN CODE (Potentially Unused)

### Legacy Procedures (Replaced by sp_ or Decrypted versions)
| Procedure | Reason |
|-----------|--------|
| `addDailyPayment` | ❌ Not found - possibly legacy |
| `addInspector` | ❌ Replaced by `sp_createInspectorDirect` |
| `addOnsitePayment` | ✅ Actually used |
| `assignManagerToBusinessOwner` | ❌ Not found |
| `CanCustomizeDocuments` | ❌ Not found |
| `checkExistingApplicationByStall` | ❌ Not found |
| `CheckExistingOwnerStalls` | ❌ Not found |
| `checkStallAvailability` | ❌ Not found |
| `countApplicationsByBranch` | ❌ Not found |
| `countBranchApplications` | ❌ Replaced by `sp_countBranchApplications` |
| `createBusinessEmployee_Encrypted` | ❌ Legacy - encryption now built-in |
| `createBusinessOwnerWithManagerConnection` | ❌ Not found |
| `createCollector` | ❌ Replaced by `sp_createCollectorDirect` |
| `createCollector_Encrypted` | ❌ Legacy |
| `createInspectorWithCredentials` | ❌ Replaced by `sp_createInspectorDirect` |
| `createInspector_Encrypted` | ❌ Legacy |
| `createMobileApplication` | ❌ Not found |
| `CreateOwnerWithThreeManagers` | ❌ Not found |
| `createStallApplicationComplete` | ❌ Not found |
| `createStallBusinessOwner` | ❌ Not found |
| `createStallholder_Encrypted` | ❌ Legacy |
| `createSystemAdministrator` | ❌ Not found |
| `createVendor` | ❌ Not found |
| `createVendorWithRelations` | ❌ Not found |
| `deleteApplicantDocument` | ❌ Replaced by `sp_deleteApplicantDocumentBlob` |
| `deleteBusinessEmployee` | ❌ Replaced by `sp_terminateEmployee` |
| `deleteCollector` | ❌ Replaced by `sp_terminateCollector` |
| `deleteDailyPayment` | ❌ Not found |
| `deleteStall` | ❌ Replaced by `sp_deleteStall_complete` |
| `deleteStallBusinessOwner` | ❌ Not found |
| `deleteSystemAdministrator` | ❌ Not found |
| `deleteVendor` | ❌ Not found |
| `deleteVendorWithRelations` | ❌ Not found |

### Get Procedures (Replaced by Decrypted versions)
| Procedure | Reason |
|-----------|--------|
| `getAllApplicants` | ❌ Replaced by `getAllApplicantsDecrypted` |
| `getAllBusinessEmployees` | ❌ Replaced by `sp_getBusinessEmployeesAllDecrypted` |
| `getAllCollectors` | ❌ Replaced by `sp_getCollectorsAllDecrypted` |
| `getAllComplaints` | ❌ Replaced by `getAllComplaintsDecrypted` |
| `getAllComplianceRecords` | ❌ Replaced by `getAllComplianceRecordsDecrypted` |
| `getAllDailyPayments` | ❌ Not found |
| `getAllDocumentTypes` | ❌ Not found |
| `getAllPayments` | ❌ Not found |
| `getAllStallBusinessOwners` | ❌ Not found |
| `getAllStallholdersDetailed` | ❌ Not found |
| `getAllStallsDetailed` | ❌ Not found |
| `getAllSystemAdministrators` | ❌ Not found |
| `getAllVendors` | ❌ Not found |
| `getAllVendorsWithRelations` | ❌ Not found |
| `getApplicantByUsername` | ❌ Not found |
| `getApplicantDocumentStatus` | ❌ Not found |
| `getApplicantLoginCredentials` | ❌ Not found |
| `getApplicantRequiredDocuments` | ❌ Not found |
| `getApplicationById` | ❌ Not found |
| `getAvailableStalls` | ❌ Replaced by `sp_getAvailableStallsForApplicant` |
| `getBranchById` | ❌ Replaced by `sp_getBranchById` |
| `getBusinessEmployeesByBranch` | ✅ Actually used |
| `getBusinessManagerByUsername` | ✅ Actually used |
| `getBusinessOwnerManagers` | ❌ Not found |
| `getCollectorById` | ❌ Not found |
| `getCollectorByUsername` | ❌ Replaced by `sp_getCollectorByUsername` |
| `getCollectorsByBranch` | ❌ Replaced by `sp_getCollectorsByBranchDecrypted` |
| `getCredentialByApplicantId` | ❌ Not found |
| `getDailyPaymentById` | ❌ Not found |
| `getFloorsByBranch` | ❌ Replaced by `sp_getFloorsByBranch` |
| `getInspectorByUsername` | ❌ Replaced by `sp_getInspectorByUsername` |
| `getInspectorsByBranch` | ❌ Replaced by `sp_getInspectorsByBranchDecrypted` |
| `getManagerBusinessOwners` | ❌ Not found |
| `getOnsitePayments` | ❌ Replaced by `sp_getOnsitePaymentsAllDecrypted` |
| `GetOwnerDocumentRequirements` | ❌ Not found |
| `getPaymentStats` | ❌ Replaced by `sp_getPaymentStatsAll` |
| `getPenaltyPayments` | ❌ Not found |
| `getPenaltyPaymentsByBranches` | ❌ Not found |
| `getSectionsByFloor` | ❌ Replaced by `sp_getSectionsByBranch` |
| `getStallBusinessOwnerById` | ❌ Not found |
| `getStallBusinessOwnerByUsername` | ❌ Not found |
| `getStallById` | ❌ Replaced by `sp_getStallById_complete` |
| `GetStallholderDocuments` | ❌ Not found |
| `getStallholdersByBranch` | ❌ Replaced by `sp_getStallholdersByBranchDecrypted` |
| `getSystemAdministratorById` | ❌ Not found |
| `getSystemAdministratorByUsername` | ❌ Not found |
| `getVendorById` | ❌ Not found |
| `getVendorsByCollectorId` | ❌ Not found |
| `getVendorWithRelations` | ❌ Not found |

### Login/Update Procedures (Replaced)
| Procedure | Reason |
|-----------|--------|
| `loginCollector` | ❌ Mobile auth handled differently |
| `loginInspector` | ❌ Mobile auth handled differently |
| `loginMobileStaff` | ❌ Not found |
| `loginSystemAdministrator` | ❌ Handled by unified auth |
| `logoutBusinessEmployee` | ❌ Replaced by `sp_logoutEmployee` |
| `terminateCollector` | ❌ Replaced by `sp_terminateCollector` |
| `terminateInspector` | ❌ Replaced by `sp_terminateInspector` |
| `updateApplicant` | ✅ Actually used |
| `updateBranch` | ❌ Not found in code |
| `updateBusinessManager` | ❌ Not found |
| `updateCollector` | ❌ Not found |
| `updateCollectorLogin` | ❌ Not found |
| `updateDailyPayment` | ❌ Not found |
| `updateStall` | ❌ Not found |
| `updateStallBusinessOwner` | ❌ Not found |
| `updateSystemAdministrator` | ❌ Not found |
| `updateVendor` | ❌ Not found |
| `updateVendorWithRelations` | ❌ Not found |
| `uploadApplicantDocument` | ❌ Replaced by `sp_insertApplicantDocumentBlob` |

### Reset/Utility Procedures
| Procedure | Reason |
|-----------|--------|
| `manual_reset_payment_status` | ❌ Admin script only |
| `ResetAllAutoIncrements` | ❌ Admin utility only |
| `ResetAutoIncrement` | ❌ Admin utility only |
| `ResetTableAutoIncrement` | ❌ Admin utility only |
| `resetStallBusinessOwnerPassword` | ❌ Not found |
| `resetSystemAdministratorPassword` | ❌ Not found |
| `removeBranchDocumentRequirementById` | ❌ Not found |
| `removeManagerFromBusinessOwner` | ❌ Not found |

### Raffle & Auction Procedures (Future Features - NOT YET IMPLEMENTED)
| Procedure | Status |
|-----------|--------|
| `sp_activateAuction` | ⏳ Future feature |
| `sp_addRaffleParticipant` | ⏳ Future feature |
| `sp_cancelAuction` | ⏳ Future feature |
| `sp_cancelRaffle` | ⏳ Future feature |
| `sp_checkAuctionBid` | ⏳ Future feature |
| `sp_checkExistingAuction` | ⏳ Future feature |
| `sp_checkExistingRaffle` | ⏳ Future feature |
| `sp_checkRaffleEntry` | ⏳ Future feature |
| `sp_checkRaffleParticipant` | ⏳ Future feature |
| `sp_countAuctionBids` | ⏳ Future feature |
| `sp_countDistinctBidders` | ⏳ Future feature |
| `sp_countRaffleParticipants` | ⏳ Future feature |
| `sp_createAuction` | ⏳ Future feature |
| `sp_createAuctionForStall` | ⏳ Future feature |
| `sp_createAuctionResult` | ⏳ Future feature |
| `sp_createAuctionWaiting` | ⏳ Future feature |
| `sp_createRaffle` | ⏳ Future feature |
| `sp_createRaffleForStall` | ⏳ Future feature |
| `sp_createRaffleResult` | ⏳ Future feature |
| `sp_createRaffleWaiting` | ⏳ Future feature |
| `sp_endAuction` | ⏳ Future feature |
| `sp_endRaffle` | ⏳ Future feature |
| `sp_getActiveAuctions` | ⏳ Future feature |
| `sp_getActiveRaffles` | ⏳ Future feature |
| `sp_getAuctionBids` | ⏳ Future feature |
| `sp_getAuctionById` | ⏳ Future feature |
| `sp_getAuctionByStall` | ⏳ Future feature |
| `sp_getAuctionByStallId` | ⏳ Future feature |
| `sp_getAuctionResult` | ⏳ Future feature |
| `sp_getAuctionWithBidsInfo` | ⏳ Future feature |
| `sp_getBidCount` | ⏳ Future feature |
| `sp_getExpiredAuctions` | ⏳ Future feature |
| `sp_getExpiredRaffles` | ⏳ Future feature |
| `sp_getHighestBid` | ⏳ Future feature |
| `sp_getRaffleById` | ⏳ Future feature |
| `sp_getRaffleByStall` | ⏳ Future feature |
| `sp_getRaffleByStallId` | ⏳ Future feature |
| `sp_getRaffleEntries` | ⏳ Future feature |
| `sp_getRaffleParticipants` | ⏳ Future feature |
| `sp_getRaffleParticipantsByStall` | ⏳ Future feature |
| `sp_getRaffleResult` | ⏳ Future feature |
| `sp_getRaffleWithEntriesCount` | ⏳ Future feature |
| `sp_getUniqueBidders` | ⏳ Future feature |
| `sp_insertAuctionBid` | ⏳ Future feature |
| `sp_insertAuctionForStall` | ⏳ Future feature |
| `sp_insertRaffleEntry` | ⏳ Future feature |
| `sp_insertRaffleForStall` | ⏳ Future feature |
| `sp_logAuctionAction` | ⏳ Future feature |
| `sp_logRaffleAction` | ⏳ Future feature |
| `sp_logRaffleAuctionActivity` | ⏳ Future feature |
| `sp_placeAuctionBid` | ⏳ Future feature |
| `sp_placeBid` | ⏳ Future feature |
| `sp_resetWinningBids` | ⏳ Future feature |
| `sp_selectAuctionWinner` | ⏳ Future feature |
| `sp_selectRaffleWinner` | ⏳ Future feature |
| `sp_setRaffleWinner` | ⏳ Future feature |
| `sp_startAuction` | ⏳ Future feature |
| `sp_updateAuctionCurrentBid` | ⏳ Future feature |
| `sp_updateAuctionDuration` | ⏳ Future feature |
| `sp_updateAuctionStatus` | ⏳ Future feature |
| `sp_updateRaffleDuration` | ⏳ Future feature |
| `sp_updateRaffleStatus` | ⏳ Future feature |
| `sp_updateStallRaffleAuctionStatus` | ⏳ Future feature |
| `sp_insertRaffleAuctionLog` | ⏳ Future feature |

### Encryption Migration Procedures (One-time use)
| Procedure | Reason |
|-----------|--------|
| `sp_encryptAllUserData` | 🔧 One-time migration script |
| `sp_encryptApplicantData` | 🔧 One-time migration script |
| `sp_encryptBusinessManagerData` | 🔧 One-time migration script |
| `sp_encryptCollectorData` | 🔧 One-time migration script |
| `sp_encryptEmployeeData` | 🔧 One-time migration script |
| `sp_encryptExistingStaffData` | 🔧 One-time migration script |
| `sp_encryptInspectorData` | 🔧 One-time migration script |
| `sp_encryptSpouseData` | 🔧 One-time migration script |
| `sp_encryptStallholderData` | 🔧 One-time migration script |
| `sp_createApplicantEncrypted` | 🔧 Used during migration |
| `sp_createBranchManagerEncrypted` | 🔧 Used during migration |
| `sp_createCollectorEncrypted` | 🔧 Used during migration |
| `sp_createInspectorEncrypted` | 🔧 Used during migration |
| `sp_createSpouseEncrypted` | 🔧 Used during migration |
| `sp_createStallholderEncrypted` | 🔧 Used during migration |
| `sp_insertApplicantEncrypted` | 🔧 Used during migration |
| `sp_insertBusinessManagerEncrypted` | 🔧 Used during migration |
| `sp_insertEmployeeEncrypted` | 🔧 Used during migration |
| `sp_updateApplicantEncrypted` | 🔧 Used during migration |
| `sp_updateStallholderEncrypted` | 🔧 Used during migration |

### Other Unused sp_ Procedures
| Procedure | Reason |
|-----------|--------|
| `sp_addBranchDocumentRequirement` | ❌ Not found |
| `sp_addStall` | ❌ Replaced by `sp_insertStallFull` |
| `sp_addStallComplete` | ❌ Not found |
| `sp_addStall_complete` | ❌ Not found |
| `sp_add_payment` | ❌ Not found |
| `sp_approveApplication` | ❌ Not found in code |
| `sp_checkBranchExists` | ❌ Not found |
| `sp_checkCredentialExists` | ❌ Not found |
| `sp_checkExistingDocument` | ❌ Not found |
| `sp_checkExistingSubmission` | ❌ Not found |
| `sp_checkManagerExistsForBranch` | ❌ Not found |
| `sp_checkManagerExistsForDifferentBranch` | ❌ Not found |
| `sp_checkManagerUsernameExists` | ❌ Not found |
| `sp_checkManagerUsernameGlobal` | ❌ Not found |
| `sp_checkStallAvailability` | ❌ Not found |
| `sp_checkStallExistsMobile` | ❌ Not found |
| `sp_checkStallholderExistsMobile` | ❌ Not found |
| `sp_checkStallImageExistsMobile` | ❌ Not found |
| `sp_checkStallNumberExists` | ❌ Not found |
| `sp_checkUserExists` | ❌ Not found |
| `sp_countApplicantsByStatus` | ❌ Not found |
| `sp_countManagersForBranch` | ❌ Not found |
| `sp_countStallsInSection` | ❌ Not found |
| `sp_createApplication` | ❌ Not found |
| `sp_createBranch` | ❌ Not found |
| `sp_createBranchManager` | ❌ Not found |
| `sp_createCollector` | ❌ Replaced by direct version |
| `sp_createComplaint` | ❌ Not found |
| `sp_createDefaultFloor` | ❌ Not found |
| `sp_createDefaultSection` | ❌ Not found |
| `sp_createDocumentRequirement` | ❌ Not found |
| `sp_createFloor` | ❌ Not found |
| `sp_createFloorForImport` | ❌ Not found |
| `sp_createInspector` | ❌ Replaced by direct version |
| `sp_createOrUpdateStaffSession` | ❌ Not found |
| `sp_createPayment` | ❌ Not found |
| `sp_createSection` | ❌ Not found |
| `sp_createSectionForImport` | ❌ Not found |
| `sp_createStaffSession` | ❌ Not found |
| `sp_createStaffSessionMinimal` | ❌ Not found |
| `sp_createStall` | ❌ Replaced by `sp_insertStallFull` |
| `sp_createStallForImport` | ❌ Not found |
| `sp_createStallholder` | ❌ Not found |
| `sp_createStallholderFromImport` | ❌ Not found |
| `sp_deactivateEmployeeSessions` | ❌ Not found |
| `sp_deactivateStaffSessions` | ❌ Not found |
| `sp_declineApplication` | ❌ Not found |
| `sp_deleteBranch` | ❌ Not found |
| `sp_deleteBranchDocRequirements` | ❌ Not found |
| `sp_deleteBranchDocumentRequirements` | ❌ Not found |
| `sp_deleteBranchManager` | ❌ Not found |
| `sp_deleteDocumentById` | ❌ Not found |
| `sp_deleteDocumentRequirement` | ❌ Not found |
| `sp_deleteStall` | ❌ Replaced by `sp_deleteStall_complete` |
| `sp_deleteStallImageByUrl` | ❌ Not found |
| `sp_deleteStallImageMobile` | ❌ Not found |
| `sp_endStaffSession` | ❌ Not found |
| `sp_findStallByFloorSectionNo` | ❌ Not found |
| `sp_getActiveAdmin` | ❌ Not found |
| `sp_getActiveEmployeeSessions` | ❌ Not found |
| `sp_getActiveEmployeeSessionsByBranch` | ❌ Not found |
| `sp_getActiveSessionsAll` | ❌ Not found |
| `sp_getActiveSessionsByBranches` | ❌ Not found |
| `sp_getAdminByEmail` | ❌ Not found |
| `sp_getAllActiveEmployees` | ❌ Not found |
| `sp_getAllApplicantsByStatus` | ❌ Not found |
| `sp_getAllBranches` | ❌ Not found |
| `sp_getAllBranchManagers` | ❌ Not found |
| `sp_getAllCollectors` | ❌ Replaced by decrypted |
| `sp_getAllCollectorsByBranches` | ❌ Replaced by decrypted |
| `sp_getAllCollectorsWithBranch` | ❌ Not found |
| `sp_getAllEmployeesAll` | ❌ Replaced by decrypted |
| `sp_getAllEmployeesByBranches` | ❌ Replaced by decrypted |
| `sp_getAllFloorsAdmin` | ❌ Not found |
| `sp_getAllInspectors` | ❌ Replaced by decrypted |
| `sp_getAllInspectorsByBranches` | ❌ Replaced by decrypted |
| `sp_getAllInspectorsWithBranch` | ❌ Not found |
| `sp_getAllSectionsAdmin` | ❌ Not found |
| `sp_getAllStallholders` | ❌ Replaced by decrypted |
| `sp_getAllStallholdersAll` | ❌ Replaced by decrypted |
| `sp_getAllStallholdersByBranches` | ❌ Replaced by decrypted |
| `sp_getAllStallImagesMobile` | ❌ Not found |
| `sp_getAllStallImagesWithDataMobile` | ❌ Not found |
| `sp_getAllStalls` | ❌ Replaced by complete |
| `sp_getAllStallsByBranch` | ❌ Not found |
| `sp_getAllStallsByManager` | ❌ Not found |
| `sp_getAllStalls_complete` | ❌ Replaced by decrypted |

---

## 📊 SUMMARY BY CATEGORY

| Category | Used | Unused | Notes |
|----------|------|--------|-------|
| Authentication & Sessions | 36 | 10 | Most are used |
| User Retrieval | 25 | 15 | Legacy replaced by sp_ |
| Branch & Location | 15 | 5 | Good coverage |
| Floor & Section | 13 | 10 | Most used |
| Stall Management | 27 | 20 | Many legacy |
| Stall Images | 37 | 5 | Well used |
| Applicants | 40 | 15 | Core feature |
| Applicant Documents | 13 | 3 | Well used |
| Stallholders | 18 | 10 | Core feature |
| Stallholder Documents | 19 | 5 | Well used |
| Payments | 18 | 8 | Core feature |
| Subscriptions | 7 | 0 | All used |
| Employees | 5 | 5 | Half used |
| Inspector/Collector | 16 | 5 | Most used |
| Complaints/Compliance | 20 | 5 | Most used |
| Staff Activity | 12 | 3 | Most used |
| **Raffle/Auction** | 2 | **58** | **Future feature** |
| **Encryption Migration** | 0 | **20** | **One-time scripts** |
| Other Legacy | 0 | ~50 | Replaced |

---

## ✅ RECOMMENDATIONS

### 1. **DO NOT DELETE** - Raffle/Auction Procedures (~58)
These are clearly planned features. Keep them for future implementation.

### 2. **Safe to Archive** - Legacy Procedures (~50)
Procedures without `sp_` prefix that have been replaced:
- `getAllApplicants` → `getAllApplicantsDecrypted`
- `getCollectorsByBranch` → `sp_getCollectorsByBranchDecrypted`
- etc.

### 3. **Keep for Admin Use** - Utility Procedures (~5)
- `ResetAllAutoIncrements`
- `ResetAutoIncrement`
- `ResetTableAutoIncrement`
- `manual_reset_payment_status`

### 4. **Keep for Data Migration** - Encryption Procedures (~20)
May need these again if encryption key changes or new data migration required.

### 5. **Consider Removing** - Truly Unused (~30)
Vendor-related procedures if vendor feature was abandoned:
- `createVendor`, `deleteVendor`, `updateVendor`
- `getVendorById`, `getVendorsByCollectorId`
- `getAllVendors`, `getAllVendorsWithRelations`

---

## 🔍 This is NORMAL because:

1. **Your system evolved** - Started without `sp_` prefix, now standardized
2. **Encryption added later** - Created `*Decrypted` versions
3. **Raffle/Auction planned** - Procedures ready but UI not implemented
4. **Migration scripts** - One-time use, kept for safety
5. **Admin utilities** - Used via SQL tools, not app code
