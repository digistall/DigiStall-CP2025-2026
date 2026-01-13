# Stored Procedure Usage Analysis

## Summary

- **Total Stored Procedures in Database**: 265+ (from `naga_stall_digitalocean.sql` and migrations)
- **Stored Procedures Used in Code**: 248
- **Potentially Unused Procedures**: 85+

---

## 1. USED STORED PROCEDURES (248 procedures)

These procedures are actively called from Backend code files:

### Authentication & Session Management
| Procedure Name | Called From |
|---------------|-------------|
| `createAdmin` | `Backend-Web/controllers/auth/loginComponents/createAdminUser.js` |
| `getBusinessManagerByUsername` | `Backend-Web/controllers/auth/loginComponents/branchManagerLogin.js` |
| `getStallBusinessOwnerByUsernameLogin` | `Backend-Web/controllers/auth/loginComponents/adminLogin.js` |
| `loginBusinessEmployee` | `Backend-Web/controllers/employees/employeeController.js` |
| `revokeAllUserTokens` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_createOrUpdateEmployeeSession` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_endEmployeeSession` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_getActiveRefreshToken` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_getAdminById` | `Backend-Web/controllers/auth/loginComponents/getCurrentUser.js` |
| `sp_getBranchManagerForCurrentUser` | `Backend-Web/controllers/auth/loginComponents/getCurrentUser.js` |
| `sp_getBusinessEmployeeByUsername` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_getBusinessEmployeeWithBranch` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_getBusinessManagerByUsername` | `Backend-Mobile/controllers/mobileStaffAuthController.js` |
| `sp_getBusinessManagerWithBranch` | `Backend-Web/controllers/auth/unifiedAuthController.js`, `Backend-Web/controllers/stalls/addStall.js` |
| `sp_getBusinessOwnerById` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_getBusinessOwnerByUsername` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_getCollectorByUsername` | `Backend-Mobile/controllers/mobileStaffAuthController.js` |
| `sp_getCredentialWithApplicant` | `Backend-Mobile/controllers/login/loginController.js` |
| `sp_getInspectorByUsername` | `Backend-Mobile/controllers/mobileStaffAuthController.js` |
| `sp_getMobileUserByUsername` | `Backend-Mobile/controllers/mobileAuthController.js` |
| `sp_getRefreshTokenByHash` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_getSystemAdminById` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_getSystemAdminByUsername` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_heartbeatBusinessEmployee` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_heartbeatBusinessManager` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_heartbeatBusinessOwner` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_heartbeatCollector` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_heartbeatInspector` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_heartbeatSystemAdmin` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_logStaffActivityLogin` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_logStaffActivityLogout` | `Backend-Web/controllers/auth/unifiedAuthController.js`, `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_logTokenActivity` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_logoutEmployee` | `Backend-Web/controllers/employees/employeeController.js` |
| `sp_revokeRefreshTokenByHash` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_storeRefreshToken` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_updateBusinessEmployeeLastLoginNow` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_updateBusinessEmployeeLastLogout` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_updateBusinessEmployeeLastLogoutNow` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_updateBusinessManagerLastLoginNow` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_updateBusinessManagerLastLogout` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_updateBusinessOwnerLastLoginNow` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_updateBusinessOwnerLastLogout` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_updateCredentialLastLogout` | `Backend-Mobile/controllers/mobileAuthController.js` |
| `sp_updateRefreshTokenLastUsed` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_updateSystemAdminLastLoginNow` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_updateSystemAdminLastLogout` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `updateCredentialLastLogin` | `Backend-Mobile/controllers/login/loginController.js` |

### Auto-Logout Procedures
| Procedure Name | Called From |
|---------------|-------------|
| `sp_autoLogoutBusinessEmployee` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_autoLogoutBusinessManager` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_autoLogoutCollector` | `Backend-Mobile/controllers/mobileStaffAuthController.js`, `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_autoLogoutInspector` | `Backend-Mobile/controllers/mobileStaffAuthController.js`, `Backend-Web/controllers/auth/enhancedAuthController.js` |

### Exists/Check Procedures
| Procedure Name | Called From |
|---------------|-------------|
| `checkComplianceRecordExists` | `Backend-Web/controllers/compliances/complianceController.js` |
| `checkExistingApplication` | `Backend-Mobile/controllers/login/loginController.js` |
| `checkExistingMobileUser` | `Backend-Mobile/controllers/mobileAuthController.js` |
| `checkPendingApplication` | `Backend-Mobile/controllers/mobileApplicationController.js` |
| `sp_checkApplicantAreaAccess` | `Backend-Mobile/controllers/stall/stallController.js` |
| `sp_checkApplicantExists` | `Backend-Web/controllers/applicants/applicantDocumentBlobController.js` |
| `sp_checkBusinessEmployeeExists` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_checkBusinessManagerExists` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_checkBusinessOwnerExists` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_checkCollectorEmailExists` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_checkCollectorTableExists` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_checkDocumentExistsForDelete` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_checkExistingApplicantDocument` | `Backend-Web/controllers/applicants/applicantDocumentBlobController.js` |
| `sp_checkExistingDocumentSubmission` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_checkExistingStallholderDocument` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_checkImageExistsById` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_checkInspectorEmailExists` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_checkStallExists` | `Backend-Web/controllers/stalls/stallImageBlobController.js`, `Backend-Mobile/controllers/stall/stallController.js` |
| `sp_checkStallExistsById` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_checkStallExistsInSection` | `Backend-Web/controllers/stalls/addStall.js` |
| `sp_checkStallExistsWeb` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_checkStallholderExists` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_checkStallImageById` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_checkStallImageExists` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_checkSystemAdminExists` | `Backend-Web/controllers/auth/enhancedAuthController.js` |
| `sp_checkUsernameExists` | `Backend-Web/controllers/applicants/applicantsComponents/credentialsController.js` |

### Applicants & Applications
| Procedure Name | Called From |
|---------------|-------------|
| `createApplicant` | `Backend-Web/controllers/applicants/applicantsComponents/createApplicant.js` |
| `createApplicantComplete` | `Backend-Web/controllers/applicantsLanding/applicantController.js` |
| `createApplication` | `Backend-Web/controllers/applications/applicationController.js`, `Backend-Mobile/controllers/login/loginController.js` |
| `deleteApplicant` | `Backend-Web/controllers/applicants/applicantsComponents/deleteApplicant.js`, `Backend-Web/controllers/applicantsLanding/applicantController.js` |
| `deleteApplication` | `Backend-Web/controllers/applications/applicationController.js` |
| `getAllApplicantsDecrypted` | `Backend-Web/controllers/applicants/applicantsComponents/getAllApplicants.js` |
| `getAllApplications` | `Backend-Web/controllers/applications/applicationController.js` |
| `getApplicantAdditionalInfo` | `Backend-Mobile/controllers/login/loginController.js` |
| `getApplicantApplicationsDetailed` | `Backend-Mobile/controllers/login/loginController.js` |
| `getApplicantByEmail` | `Backend-Web/controllers/applicants/applicantsComponents/createApplicant.js` |
| `getApplicantById` | `Backend-Web/controllers/applicants/applicantsComponents/getApplicantById.js`, `Backend-Web/controllers/applicants/applicantsComponents/deleteApplicant.js`, `Backend-Web/controllers/applicants/applicantsComponents/updateApplicant.js`, `Backend-Mobile/controllers/user/userController.js` |
| `getApplicantComplete` | `Backend-Web/controllers/applications/applicationController.js`, `Backend-Web/controllers/applicantsLanding/applicantController.js` |
| `getApplicationsByApplicant` | `Backend-Web/controllers/applications/applicationController.js` |
| `getAppliedAreasByApplicant` | `Backend-Mobile/controllers/login/loginController.js` |
| `getAvailableStallsByApplicant` | `Backend-Mobile/controllers/login/loginController.js` |
| `getMobileApplicationStatus` | `Backend-Mobile/controllers/mobileApplicationController.js` |
| `getMobileUserApplications` | `Backend-Mobile/controllers/mobileApplicationController.js` |
| `sp_countBranchApplications` | `Backend-Mobile/controllers/stall/stallController.js` |
| `sp_countBranchApplicationsForApplicant` | `Backend-Mobile/controllers/login/loginController.js` |
| `sp_createCredential` | `Backend-Web/controllers/applicants/applicantsComponents/credentialsController.js` |
| `sp_deleteApplicantCascade` | `Backend-Web/controllers/applicants/applicantsComponents/declineApplicant.js` |
| `sp_getApplicantById` | `Backend-Web/controllers/applicants/applicantsComponents/declineApplicant.js`, `Backend-Web/controllers/applicants/applicantsComponents/credentialsController.js`, `Backend-Mobile/controllers/mobileAuthController.js` |
| `sp_getApplicantDetailsForComplaintDecrypted` | `Backend-Mobile/controllers/stallholder/complaintController.js` |
| `sp_getAllCredentials` | `Backend-Web/controllers/applicants/applicantsComponents/credentialsController.js` |
| `sp_getAllParticipants` | `Backend-Web/controllers/applicants/applicantsComponents/getAllParticipants.js` |
| `sp_getAppliedAreasForApplicant` | `Backend-Mobile/controllers/stall/stallController.js` |
| `sp_getBusinessInfoByApplicantId` | `Backend-Mobile/controllers/mobileAuthController.js` |
| `sp_getLatestApplicationByApplicantId` | `Backend-Mobile/controllers/mobileAuthController.js` |
| `sp_getLatestApplicationInfo` | `Backend-Mobile/controllers/login/loginController.js` |
| `sp_getOtherInfoByApplicantId` | `Backend-Mobile/controllers/mobileAuthController.js` |
| `sp_getSpouseByApplicantId` | `Backend-Mobile/controllers/mobileAuthController.js` |
| `updateApplicant` | `Backend-Web/controllers/applicants/applicantsComponents/updateApplicant.js`, `Backend-Mobile/controllers/user/userController.js` |
| `updateApplicantComplete` | `Backend-Web/controllers/applicantsLanding/applicantController.js` |
| `updateApplicationStatus` | `Backend-Web/controllers/applications/applicationController.js` |
| `updateMobileApplication` | `Backend-Mobile/controllers/mobileApplicationController.js` |

### Applicant Documents (Blob Storage)
| Procedure Name | Called From |
|---------------|-------------|
| `sp_deleteApplicantDocumentBlob` | `Backend-Web/controllers/applicants/applicantDocumentBlobController.js` |
| `sp_getAllApplicantDocuments` | `Backend-Web/controllers/applicants/applicantDocumentBlobController.js` |
| `sp_getAllApplicantDocumentsWithData` | `Backend-Web/controllers/applicants/applicantDocumentBlobController.js` |
| `sp_getApplicantDocumentBlob` | `Backend-Web/controllers/applicants/applicantDocumentBlobController.js` |
| `sp_getApplicantDocumentBlobById` | `Backend-Web/controllers/applicants/applicantDocumentBlobController.js` |
| `sp_getApplicantDocumentByTypeExtended` | `Backend-Web/controllers/applicants/applicantDocumentBlobController.js` |
| `sp_getDocumentTypeByName` | `Backend-Web/controllers/applicants/applicantDocumentBlobController.js` |
| `sp_insertApplicantDocumentBlob` | `Backend-Web/controllers/applicants/applicantDocumentBlobController.js` |
| `sp_updateApplicantDocumentBlob` | `Backend-Web/controllers/applicants/applicantDocumentBlobController.js` |
| `sp_updateApplicantDocumentVerification` | `Backend-Web/controllers/applicants/applicantDocumentBlobController.js` |

### Branch Management
| Procedure Name | Called From |
|---------------|-------------|
| `createBranch` | `Backend-Web/controllers/branch/branchComponents/createBranch.js` |
| `createFloor` | `Backend-Web/controllers/branch/branchComponents/createFloor.js` |
| `createSection` | `Backend-Web/controllers/branch/branchComponents/createSection.js` |
| `deleteBranch` | `Backend-Web/controllers/branch/branchComponents/deleteBranch.js` |
| `deleteFloor` | `Backend-Web/controllers/branch/branchComponents/deleteFloor.js` |
| `deleteSection` | `Backend-Web/controllers/branch/branchComponents/deleteSection.js` |
| `getAllActiveBranches` | `Backend-Mobile/controllers/login/loginController.js` |
| `getAllBranchesDetailed` | `Backend-Web/controllers/branch/branchComponents/getAllBranches.js`, `Backend-Web/controllers/branch/branchComponents/createBranch.js` |
| `sp_getAllFloors` | `Backend-Web/controllers/branch/branchComponents/getFloors.js` |
| `sp_getAllSections` | `Backend-Web/controllers/branch/branchComponents/getSections.js` |
| `sp_getBranchById` | `Backend-Web/controllers/auth/unifiedAuthController.js` |
| `sp_getBranchIdForEmployee` | `Backend-Web/middleware/rolePermissions.js` |
| `sp_getBranchIdForManager` | `Backend-Web/middleware/rolePermissions.js` |
| `sp_getBranchIdsForOwner` | `Backend-Web/middleware/rolePermissions.js` |
| `sp_getBranchInfoWithManager` | `Backend-Web/controllers/stalls/addStall.js` |
| `sp_getBranchManagerById` | `Backend-Web/controllers/branch/branchComponents/getBranchManagerById.js` |
| `sp_getBranches` | `Backend-Web/controllers/stallsLanding/LandingPageComponents-StallController/getBranches/getBranches.js` |
| `sp_getFloorsByBranch` | `Backend-Web/controllers/branch/branchComponents/getFloors.js` |
| `sp_getFloorsByBranches` | `Backend-Web/controllers/branch/branchComponents/getFloors.js` |
| `sp_getSectionsByBranch` | `Backend-Web/controllers/branch/branchComponents/getSections.js` |
| `sp_getSectionsByBranches` | `Backend-Web/controllers/branch/branchComponents/getSections.js` |
| `updateFloor` | `Backend-Web/controllers/branch/branchComponents/updateFloor.js` |
| `updateSection` | `Backend-Web/controllers/branch/branchComponents/updateSection.js` |

### Employees
| Procedure Name | Called From |
|---------------|-------------|
| `createBusinessEmployee` | `Backend-Web/controllers/employees/employeeController.js` |
| `getBusinessEmployeeById` | `Backend-Web/controllers/auth/unifiedAuthController.js`, `Backend-Web/controllers/employees/employeeController.js` |
| `getBusinessEmployeeByUsername` | `Backend-Web/controllers/employees/employeeController.js` |
| `getBusinessEmployeesByBranch` | `Backend-Web/controllers/employees/employeeController.js` |
| `resetBusinessEmployeePassword` | `Backend-Web/controllers/employees/employeeController.js` |
| `sp_getBusinessEmployeesAllDecrypted` | `Backend-Web/controllers/employees/employeeController.js` |
| `sp_getBusinessEmployeesByBranchDecrypted` | `Backend-Web/controllers/employees/employeeController.js` |
| `sp_getEmployeeWithBranchInfo` | `Backend-Web/controllers/stalls/addStall.js` |
| `sp_terminateEmployee` | `Backend-Web/controllers/employees/employeeController.js` |
| `updateBusinessEmployee` | `Backend-Web/controllers/employees/employeeController.js` |

### Inspector & Collector (Mobile Staff)
| Procedure Name | Called From |
|---------------|-------------|
| `getStallholdersByBranchDecrypted` | `Backend-Mobile/controllers/inspector/inspectorController.js` |
| `reportStallholder` | `Backend-Mobile/controllers/inspector/inspectorController.js` |
| `sp_createCollectorAssignmentDirect` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_createCollectorDirect` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_createInspectorAssignmentDirect` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_createInspectorDirect` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_getCollectorBranchAssignment` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_getCollectorsAllDecrypted` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_getCollectorsByBranchDecrypted` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_getInspectorBranchAssignment` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_getInspectorsAllDecrypted` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_getInspectorsByBranchDecrypted` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_getStallholderDetailByIdWithBranch` | `Backend-Mobile/controllers/inspector/inspectorController.js` |
| `sp_getViolationTypes` | `Backend-Mobile/controllers/inspector/inspectorController.js` |
| `sp_logCollectorAction` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_logInspectorAction` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_logStaffActivity` | `Backend-Mobile/controllers/mobileStaffAuthController.js` |
| `sp_resetCollectorPassword` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_resetInspectorPassword` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_terminateCollector` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |
| `sp_terminateInspector` | `Backend-Web/controllers/mobileStaff/mobileStaffController.js` |

### Stallholders
| Procedure Name | Called From |
|---------------|-------------|
| `createStallholder` | `Backend-Web/controllers/stallholders/stallholderController.js` |
| `deleteStallholder` | `Backend-Web/controllers/stallholders/stallholderController.js` |
| `getStallholderById` | `Backend-Web/controllers/stallholders/stallholderController.js` |
| `getStallholderBranchId` | `Backend-Web/controllers/compliances/complianceController.js` |
| `getViolationHistoryByStallholder` | `Backend-Web/controllers/stallholders/stallholderController.js` |
| `sp_getAllStallholdersAllDecrypted` | `Backend-Web/controllers/stallholders/stallholderController.js` |
| `sp_getAllStallholdersByBranchesDecrypted` | `Backend-Web/controllers/stallholders/stallholderController.js` |
| `sp_getComplaintsByStallholderDecrypted` | `Backend-Mobile/controllers/stallholder/complaintController.js` |
| `sp_getFullStallholderInfo` | `Backend-Mobile/controllers/login/loginController.js` |
| `sp_getStallholderByApplicantId` | `Backend-Mobile/controllers/mobileAuthController.js`, `Backend-Mobile/controllers/stallholder/paymentController.js` |
| `sp_getStallholderDetailsForComplaintDecrypted` | `Backend-Mobile/controllers/stallholder/complaintController.js`, `Backend-Mobile/controllers/stallholder/profileController.js` |
| `sp_getStallholderIdByApplicant` | `Backend-Mobile/controllers/stallholder/paymentController.js` |
| `updateStallholder` | `Backend-Web/controllers/stallholders/stallholderController.js` |

### Stallholder Documents
| Procedure Name | Called From |
|---------------|-------------|
| `getBranchDocumentRequirements` | `Backend-Web/controllers/stallholders/documentController.js` |
| `removeBranchDocumentRequirement` | `Backend-Web/controllers/stallholders/documentController.js` |
| `setBranchDocumentRequirement` | `Backend-Web/controllers/stallholders/documentController.js` |
| `sp_deleteStallholderDocument` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_getAllDocumentSubmissionsForBranch` | `Backend-Web/controllers/stallholders/documentController.js` |
| `sp_getAllStallholderDocuments` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_getBranchDocRequirementsFull` | `Backend-Mobile/controllers/user/stallholderDocumentController.js` |
| `sp_getDocumentById` | `Backend-Web/controllers/stallholders/documentController.js` |
| `sp_getDocumentsByStallholderId` | `Backend-Web/controllers/stallholders/documentController.js` |
| `sp_getDocumentSubmissionBlobById` | `Backend-Web/controllers/stallholders/documentController.js` |
| `sp_getDocumentSubmissionById` | `Backend-Web/controllers/stallholders/documentController.js` |
| `sp_getDocumentSubmissionCounts` | `Backend-Web/controllers/stallholders/documentController.js` |
| `sp_getPendingDocumentSubmissions` | `Backend-Web/controllers/stallholders/documentController.js` |
| `sp_getStallholderDocumentBlob` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_getStallholderDocumentBlobById` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_getStallholderDocumentSubmissionBlob` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_getStallholderStallsForDocuments` | `Backend-Mobile/controllers/user/stallholderDocumentController.js` |
| `sp_getStallholderUploadedDocuments` | `Backend-Mobile/controllers/user/stallholderDocumentController.js` |
| `sp_insertDocumentSubmissionBlob` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_insertStallholderDocumentBlob` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_reviewDocumentSubmission` | `Backend-Web/controllers/stallholders/documentController.js` |
| `sp_reviewStallholderDocument` | `Backend-Web/controllers/stallholders/documentController.js` |
| `sp_updateDocumentSubmissionBlob` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_updateStallholderDocumentBlob` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_updateStallholderDocumentVerification` | `Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js` |
| `sp_uploadStallholderDocument` | `Backend-Mobile/controllers/user/stallholderDocumentController.js` |

### Stalls
| Procedure Name | Called From |
|---------------|-------------|
| `getStallsFiltered` | `Backend-Web/controllers/applications/applicationController.js` |
| `getStallWithBranchInfo` | `Backend-Mobile/controllers/login/loginController.js` |
| `sp_deleteStall_complete` | `Backend-Web/controllers/stalls/stallComponents/deleteStall.js` |
| `sp_getAllStalls_complete_decrypted` | `Backend-Web/controllers/stalls/stallComponents/getAllStalls.js` |
| `sp_getAllStallsForLanding` | `Backend-Web/controllers/stallsLanding/LandingPageComponents-StallController/getAllStalls/getAllStalls.js` |
| `sp_getAvailableAreasForApplicant` | `Backend-Mobile/controllers/stall/stallController.js` |
| `sp_getAvailableStallsForApplicant` | `Backend-Mobile/controllers/stall/stallController.js` |
| `sp_getStallByIdForLanding` | `Backend-Web/controllers/stallsLanding/LandingPageComponents-StallController/getStallById/getStallById.js` |
| `sp_getStallById_complete` | `Backend-Web/controllers/stalls/stallComponents/getStallById.js` |
| `sp_getStallDetailForApplicant` | `Backend-Mobile/controllers/stall/stallController.js` |
| `sp_getStallsByAreaForApplicant` | `Backend-Mobile/controllers/stall/stallController.js` |
| `sp_getStallsByAreaOrBranch` | `Backend-Web/controllers/stallsLanding/LandingPageComponents-StallController/getStallsByArea/getStallsByArea.js` |
| `sp_getStallsByLocation` | `Backend-Web/controllers/stallsLanding/LandingPageComponents-StallController/getStallsByLocation/getStallsByLocation.js` |
| `sp_getStallsByTypeForApplicant` | `Backend-Mobile/controllers/stall/stallController.js` |
| `sp_insertAuctionRecord` | `Backend-Web/controllers/stalls/addStall.js` |
| `sp_insertRaffleRecord` | `Backend-Web/controllers/stalls/addStall.js` |
| `sp_insertStallFull` | `Backend-Web/controllers/stalls/addStall.js` |
| `sp_searchStallsForApplicant` | `Backend-Mobile/controllers/stall/stallController.js` |
| `sp_validateFloorSectionBranch` | `Backend-Web/controllers/stalls/addStall.js` |

### Stall Images (Blob Storage)
| Procedure Name | Called From |
|---------------|-------------|
| `sp_addStallImage` | `Backend-Web/controllers/stalls/stallImageController.js` |
| `sp_deleteStallImage` | `Backend-Web/controllers/stalls/stallImageController.js`, `Backend-Web/controllers/stalls/stallImageBlobController.js`, `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_getAllStallImages` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_getAllStallImagesWithData` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_getNextStallImageOrder` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_getNextStallImageOrderMobile` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_getRemainingImagesForReorder` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_getRemainingStallImages` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_getStallFirstImage` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_getStallIdFromImage` | `Backend-Web/controllers/stalls/stallImageBlobController.js`, `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_getStallImageById` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_getStallImageByOrder` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_getStallImageByPosition` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_getStallImageCount` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_getStallImageCountMobile` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_getStallImageDataById` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_getStallImageForDelete` | `Backend-Web/controllers/stalls/stallImageBlobController.js`, `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_getStallImageInfoById` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_getStallImages` | `Backend-Web/controllers/stalls/stallImageController.js` |
| `sp_getStallImagesPublic` | `Backend-Mobile/controllers/stall/stallController.js` |
| `sp_getStallImagesWithData` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_getStallPrimaryImage` | `Backend-Web/controllers/stalls/stallImageBlobController.js`, `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_insertStallImageBlob` | `Backend-Web/controllers/stalls/stallImageBlobController.js`, `Backend-Web/controllers/stalls/addStall.js` |
| `sp_insertStallImageBlobMobile` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_setFirstImageAsPrimary` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_setImageAsPrimary` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_setNextPrimaryImage` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_setStallImagePrimary` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_setStallPrimaryImage` | `Backend-Web/controllers/stalls/stallImageController.js` |
| `sp_unsetAllPrimaryImages` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_unsetStallPrimaryImages` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_unsetStallPrimaryImagesMobile` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_updateImageDisplayOrder` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_updateStallImageBlob` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_updateStallImageBlobData` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |
| `sp_updateStallImageOrder` | `Backend-Web/controllers/stalls/stallImageBlobController.js` |
| `sp_verifyStallExistsMobile` | `Backend-Mobile/controllers/stalls/stallImageBlobController.js` |

### Landing Page
| Procedure Name | Called From |
|---------------|-------------|
| `sp_getAvailableAreas` | `Backend-Web/controllers/stallsLanding/LandingPageComponents-StallController/getAvailableAreas/getAvailableAreas.js` |
| `sp_getAvailableMarkets` | `Backend-Web/controllers/stallsLanding/LandingPageComponents-StallController/getAvailableMarkets/getAvailableMarkets.js` |
| `sp_getFilteredStalls` | `Backend-Web/controllers/stallsLanding/LandingPageComponents-StallController/getFilteredStalls/getFilteredStalls.js` |
| `sp_getLandingPageFilterOptions` | `Backend-Web/controllers/stalls/stallComponents/landingPageComponents/getLandingPageFilterOptions/getLandingPageFilterOptions.js` |
| `sp_getLandingPageStallholdersList` | `Backend-Web/controllers/stalls/stallComponents/landingPageComponents/getLandingPageStallholders/getLandingPageStallholders.js` |
| `sp_getLandingPageStallsList` | `Backend-Web/controllers/stalls/stallComponents/landingPageComponents/getLandingPageStallsList/getLandingPageStallsList.js` |
| `sp_getLandingPageStats` | `Backend-Web/controllers/stallsLanding/LandingPageComponents-StallController/getLandingPageStats/getLandingPageStats.js`, `Backend-Web/controllers/stalls/stallComponents/landingPageComponents/getLandingPageStats/getLandingPageStats.js` |
| `sp_getLocationsByArea` | `Backend-Web/controllers/stallsLanding/LandingPageComponents-StallController/getLocationsByArea/getLocationsByArea.js` |

### Payments
| Procedure Name | Called From |
|---------------|-------------|
| `addOnsitePayment` | `Backend-Web/controllers/payments/paymentController.js` |
| `getUnpaidViolationsByStallholder` | `Backend-Web/controllers/payments/paymentController.js` |
| `processViolationPayment` | `Backend-Web/controllers/payments/paymentController.js` |
| `sp_approvePayment` | `Backend-Web/controllers/payments/paymentController.js` |
| `sp_declinePayment` | `Backend-Web/controllers/payments/paymentController.js` |
| `sp_generate_receipt_number` | `Backend-Web/controllers/payments/paymentController.js` |
| `sp_get_all_stallholders_decrypted` | `Backend-Web/controllers/payments/paymentController.js` |
| `sp_get_stallholder_details_decrypted` | `Backend-Web/controllers/payments/paymentController.js` |
| `sp_getAllPaymentsByStallholder` | `Backend-Mobile/controllers/stallholder/paymentController.js` |
| `sp_getOnlinePaymentsAllDecrypted` | `Backend-Web/controllers/payments/paymentController.js` |
| `sp_getOnlinePaymentsByBranchesDecrypted` | `Backend-Web/controllers/payments/paymentController.js` |
| `sp_getOnsitePaymentsAllDecrypted` | `Backend-Web/controllers/payments/paymentController.js` |
| `sp_getOnsitePaymentsByBranchesDecrypted` | `Backend-Web/controllers/payments/paymentController.js` |
| `sp_getPaymentCountByStallholder` | `Backend-Mobile/controllers/stallholder/paymentController.js` |
| `sp_getPaymentsByStallholderPaginated` | `Backend-Mobile/controllers/stallholder/paymentController.js` |
| `sp_getPaymentStatsAll` | `Backend-Web/controllers/payments/paymentController.js` |
| `sp_getPaymentStatsByBranches` | `Backend-Web/controllers/payments/paymentController.js` |
| `sp_getPaymentSummaryByStallholder` | `Backend-Mobile/controllers/stallholder/paymentController.js` |

### Complaints
| Procedure Name | Called From |
|---------------|-------------|
| `createComplaint` | `Backend-Web/controllers/complaints/complaintController.js` |
| `deleteComplaint` | `Backend-Web/controllers/complaints/complaintController.js` |
| `getAllComplaintsDecrypted` | `Backend-Web/controllers/complaints/complaintController.js` |
| `getComplaintById` | `Backend-Web/controllers/complaints/complaintController.js` |
| `resolveComplaint` | `Backend-Web/controllers/complaints/complaintController.js` |
| `sp_ensureComplaintTableExists` | `Backend-Mobile/controllers/stallholder/complaintController.js` |
| `sp_insertComplaint` | `Backend-Mobile/controllers/stallholder/complaintController.js` |
| `updateComplaint` | `Backend-Web/controllers/complaints/complaintController.js` |

### Compliance
| Procedure Name | Called From |
|---------------|-------------|
| `createComplianceRecord` | `Backend-Web/controllers/compliances/complianceController.js` |
| `deleteComplianceRecord` | `Backend-Web/controllers/compliances/complianceController.js` |
| `getAllComplianceRecordsDecrypted` | `Backend-Web/controllers/compliances/complianceController.js` |
| `getComplianceRecordById` | `Backend-Web/controllers/compliances/complianceController.js` |
| `getComplianceRecordByIdDecrypted` | `Backend-Web/controllers/compliances/complianceController.js` |
| `updateComplianceRecord` | `Backend-Web/controllers/compliances/complianceController.js` |

### Subscriptions
| Procedure Name | Called From |
|---------------|-------------|
| `createBusinessOwnerWithSubscription` | `Backend-Web/controllers/subscriptions/subscriptionController.js` |
| `getAllBusinessOwnersWithSubscription` | `Backend-Web/controllers/subscriptions/subscriptionController.js` |
| `getAllSubscriptionPlans` | `Backend-Web/controllers/subscriptions/subscriptionController.js` |
| `getBusinessOwnerPaymentHistory` | `Backend-Web/controllers/subscriptions/subscriptionController.js` |
| `getBusinessOwnerSubscription` | `Backend-Web/controllers/subscriptions/subscriptionController.js` |
| `getSystemAdminDashboardStats` | `Backend-Web/controllers/subscriptions/subscriptionController.js` |
| `recordSubscriptionPayment` | `Backend-Web/controllers/subscriptions/subscriptionController.js` |

### Activity Logs
| Procedure Name | Called From |
|---------------|-------------|
| `sp_clearAllActivityLogs` | `Backend-Web/controllers/activityLog/staffActivityLogController.js` |
| `sp_countStaffActivities` | `Backend-Web/controllers/activityLog/staffActivityLogController.js` |
| `sp_countStaffActivityById` | `Backend-Web/controllers/activityLog/staffActivityLogController.js` |
| `sp_getActivitySummaryByAction` | `Backend-Web/controllers/activityLog/staffActivityLogController.js` |
| `sp_getActivitySummaryByType` | `Backend-Web/controllers/activityLog/staffActivityLogController.js` |
| `sp_getAllStaffActivities` | `Backend-Web/controllers/activityLog/staffActivityLogController.js` |
| `sp_getMostActiveStaff` | `Backend-Web/controllers/activityLog/staffActivityLogController.js` |
| `sp_getRecentFailedActions` | `Backend-Web/controllers/activityLog/staffActivityLogController.js` |
| `sp_getStaffActivityById` | `Backend-Web/controllers/activityLog/staffActivityLogController.js` |
| `sp_insertStaffActivityLog` | `Backend-Web/controllers/activityLog/staffActivityLogController.js` |

### Mobile User Registration
| Procedure Name | Called From |
|---------------|-------------|
| `registerMobileUser` | `Backend-Mobile/controllers/mobileAuthController.js` |

### Email Templates
| Procedure Name | Called From |
|---------------|-------------|
| `getEmailTemplate` | `Backend-Web/services/emailService.js` |

---

## 2. POTENTIALLY UNUSED PROCEDURES (85+ procedures)

The following procedures exist in the database but do NOT appear to be called from any Backend code:

### Administrative/Utility (Likely never used in app code)
| Procedure Name | Notes |
|---------------|-------|
| `addInspector` | Replaced by `sp_createInspectorDirect` |
| `assignManagerToBusinessOwner` | May be for admin scripts only |
| `CanCustomizeDocuments` | May be for future feature |
| `CheckExistingOwnerStalls` | May be unused |
| `checkExistingApplicationByStall` | Duplicate functionality |
| `checkStallAvailability` | Replaced by sp_ version |
| `countApplicationsByBranch` | May use `countBranchApplications` instead |
| `CreateOwnerWithThreeManagers` | Setup script only |
| `createBusinessOwnerWithManagerConnection` | May be replaced |
| `createCollector` | Replaced by `sp_createCollectorDirect` |
| `createInspectorWithCredentials` | Replaced by `sp_createInspectorDirect` |
| `createMobileApplication` | May be replaced |
| `createStallApplicationComplete` | May be unused |
| `createStallBusinessOwner` | May be replaced |
| `createSystemAdministrator` | Setup only |
| `deleteApplicantDocument` | Replaced by blob version |
| `deleteBusinessEmployee` | May use `sp_terminateEmployee` instead |
| `deleteStall` | Replaced by `sp_deleteStall_complete` |
| `deleteStallBusinessOwner` | Admin only |
| `deleteSystemAdministrator` | Admin only |

### Getters that may be replaced
| Procedure Name | Notes |
|---------------|-------|
| `getAllActiveInspectors` | May be replaced by decrypted version |
| `getAllApplicants` | Replaced by `getAllApplicantsDecrypted` |
| `getAllBusinessEmployees` | Replaced by decrypted version |
| `getAllComplaints` | Replaced by `getAllComplaintsDecrypted` |
| `getAllComplianceRecords` | Replaced by `getAllComplianceRecordsDecrypted` |
| `getAllDocumentTypes` | May be unused |
| `getAllPayments` | Replaced by specific payment procedures |
| `getAllStallBusinessOwners` | May be unused |
| `getAllStallholdersDetailed` | Replaced by decrypted version |
| `getAllStallsDetailed` | Replaced by new procedures |
| `getAllSystemAdministrators` | Admin only |
| `getAllViolationTypes` | Replaced by sp_ version |
| `getApplicantBusinessOwners` | May be unused |
| `getApplicantByUsername` | May be unused |
| `getApplicantDocumentStatus` | May be unused |
| `getApplicantLoginCredentials` | Replaced |
| `getApplicantRequiredDocuments` | May be unused |
| `getApplicationById` | May be unused |
| `getAvailableStalls` | Replaced by applicant-specific version |
| `getBranchById` | Replaced by sp_ version |
| `getBusinessOwnerManagers` | May be unused |
| `getCollectorsByBranch` | Replaced by decrypted version |
| `getComplianceStatistics` | May be unused |
| `getCredentialByApplicantId` | May be unused |
| `getFloorsByBranch` | Replaced by sp_ version |
| `getInspectorsByBranch` | Replaced by decrypted version |
| `getManagerBusinessOwners` | May be unused |
| `getMobileUserByUsername` | Replaced by sp_ version |
| `getOnsitePayments` | Replaced by decrypted version |
| `GetOwnerDocumentRequirements` | May be unused |
| `getPaymentStats` | Replaced by branch-specific version |
| `getSectionsByFloor` | May be unused |
| `getStallBusinessOwnerById` | May be unused |
| `getStallBusinessOwnerByUsername` | May be unused |
| `getStallById` | Replaced by complete version |
| `GetStallholderDocuments` | Replaced by new procedures |
| `getStallholdersByBranch` | Replaced by decrypted version |
| `getSystemAdministratorById` | May be unused |
| `getSystemAdministratorByUsername` | May be unused |
| `getViolationPenaltiesByViolationId` | May be unused in web |

### Login/Auth that may be replaced
| Procedure Name | Notes |
|---------------|-------|
| `loginCollector` | May use sp_ version |
| `loginInspector` | May use sp_ version |
| `loginMobileStaff` | May be replaced |
| `loginSystemAdministrator` | May be unused |
| `logoutBusinessEmployee` | Replaced by sp_ version |

### Maintenance/Utility
| Procedure Name | Notes |
|---------------|-------|
| `manual_reset_payment_status` | Maintenance script |
| `removeBranchDocumentRequirementById` | May be unused |
| `removeManagerFromBusinessOwner` | Admin only |
| `ResetAllAutoIncrements` | Utility script |
| `ResetAutoIncrement` | Utility script |
| `resetStallBusinessOwnerPassword` | May be unused |
| `resetSystemAdministratorPassword` | Admin only |
| `ResetTableAutoIncrement` | Utility script |

### Raffle/Auction (May be future features)
| Procedure Name | Notes |
|---------------|-------|
| `sp_addRaffleParticipant` | Not called from web/mobile |
| `sp_cancelAuction` | Not called from web/mobile |
| `sp_cancelRaffle` | Not called from web/mobile |
| `sp_checkBranchExists` | May be unused |
| `sp_checkExistingAuction` | Not called from web/mobile |
| `sp_checkExistingRaffle` | Not called from web/mobile |
| `sp_checkManagerExistsForBranch` | May be unused |
| `sp_checkManagerExistsForDifferentBranch` | May be unused |
| `sp_checkManagerUsernameExists` | May be unused |
| `sp_checkManagerUsernameGlobal` | May be unused |
| `sp_checkRaffleParticipant` | Not called from web/mobile |
| `sp_countAuctionBids` | Not called from web/mobile |
| `sp_countDistinctBidders` | Not called from web/mobile |
| `sp_countManagersForBranch` | May be unused |
| `sp_countRaffleParticipants` | Not called from web/mobile |
| `sp_createApplication` | May use base version |
| `sp_createAuctionForStall` | Not called from web/mobile |
| `sp_createAuctionResult` | Not called from web/mobile |
| `sp_createAuctionWaiting` | Not called from web/mobile |
| `sp_createBranchManager` | May be unused |
| `sp_createRaffleForStall` | Not called from web/mobile |
| `sp_createRaffleResult` | Not called from web/mobile |
| `sp_createRaffleWaiting` | Not called from web/mobile |
| `sp_endAuction` | Not called from web/mobile |
| `sp_endRaffle` | Not called from web/mobile |
| `sp_logRaffleAuctionActivity` | Not called from web/mobile |
| `sp_placeAuctionBid` | Not called from web/mobile |
| `sp_resetWinningBids` | Not called from web/mobile |
| `sp_setRaffleWinner` | Not called from web/mobile |

### Other Unused sp_ Procedures
| Procedure Name | Notes |
|---------------|-------|
| `sp_add_payment` | May use `addOnsitePayment` instead |
| `sp_addBranchDocumentRequirement` | May be unused |
| `sp_addStall` | Replaced by `sp_insertStallFull` |
| `sp_addStallComplete` | Replaced by newer version |
| `sp_addStall_complete` | May be replaced |
| `sp_deleteBranch` | May use base version |
| `sp_deleteBranchDocumentRequirements` | May be unused |
| `sp_deleteBranchManager` | May be unused |
| `sp_deleteStall` | Replaced by `sp_deleteStall_complete` |
| `sp_get_all_stallholders` | Replaced by decrypted version |
| `sp_get_payments_for_manager` | May be unused |
| `sp_get_stallholder_details` | Replaced by decrypted version |
| `sp_get_stallholders_for_manager` | May be unused |
| `sp_getActiveAdmin` | May be unused |
| `sp_getAdminByEmail` | May be unused |
| `sp_getAllActiveEmployees` | Replaced by decrypted version |
| `sp_getAllStalls_complete` | Replaced by decrypted version |
| `sp_getAllStallsByBranch` | Replaced by decrypted version |
| `sp_getAllStallsByManager` | Replaced by decrypted version |
| `sp_getApplicantName` | May be unused |
| `sp_getApplicationByApplicantId` | May be unused |
| `sp_getAvailableStallsByBranch` | May be unused |
| `sp_getBranchIdFromBusinessManager` | May be unused |
| `sp_getBranchManagerByEmail` | May be unused |
| `sp_getBusinessEmployeeByEmail` | May be unused |
| `sp_getBusinessManagerByEmail` | May be unused |
| `sp_getDistinctAreas` | May be unused |
| `sp_getDistinctBranches` | May be unused |
| `sp_getDocumentTypeByRequirementId` | May be unused |
| `sp_getEmployeesByBranchIds` | May be unused |
| `sp_getExistingManagerForBranch` | May be unused |
| `sp_getFloorByBranchWithDetails` | May be unused |
| `sp_getFloorByManagerWithDetails` | May be unused |
| `sp_getFloorCountByManager` | May be unused |
| `sp_getFloorsByBranchId` | May be unused |
| `sp_getFloorsByBranchIds` | May be unused |
| `sp_getLandingPageStallholders` | Replaced by list version |
| `sp_getLandingPageStalls` | Replaced by list version |
| `sp_getLocationsByBranch` | May be unused |
| `sp_getLocationsByCity` | May be unused |
| `sp_getSectionsByFloorId` | May be unused |
| `sp_getSectionsByFloorIds` | May be unused |
| `sp_getStallById` | Replaced by complete version |
| `sp_getStallImage` | Replaced by blob version |
| `sp_updateApplicationStatus` | May use base version |
| `sp_updateBranchManager` | May be unused |
| `sp_updateLastLogin` | Replaced by specific versions |
| `sp_updateStall` | Replaced by complete version |
| `sp_updateStallRaffleAuctionStatus` | May be unused |
| `sp_updateStall_complete` | May be unused |
| `sp_uploadApplicantDocument` | Replaced by blob version |
| `sp_uploadStallImage` | Replaced by blob version |
| `terminateCollector` | Replaced by sp_ version |
| `terminateInspector` | Replaced by sp_ version |
| `updateBranch` | May be unused |
| `updateBusinessManager` | May be unused |
| `updateCollectorLogin` | May be unused |
| `updateStall` | Replaced by complete version |
| `updateStallBusinessOwner` | May be unused |
| `updateSystemAdministrator` | Admin only |
| `uploadApplicantDocument` | Replaced by blob version |

---

## Recommendations

1. **DO NOT DELETE immediately** - Many procedures may be called from:
   - Database triggers
   - Other stored procedures (nested calls)
   - Admin scripts
   - Future features

2. **Mark for review**: Add a comment like `-- REVIEW: Possibly unused as of 2026-01-13` to procedures in the "unused" list

3. **Check nested calls**: Some procedures call other procedures internally - verify before removing

4. **Archive strategy**: Instead of deleting, consider:
   - Moving to an `_archive` schema
   - Adding `_deprecated` suffix
   - Creating a backup SQL file

5. **Raffle/Auction procedures**: These appear to be future features - keep them but document as "planned feature"

---

*Generated on: January 13, 2026*
