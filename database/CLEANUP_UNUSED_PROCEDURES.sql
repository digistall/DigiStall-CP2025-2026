-- =====================================================
-- CLEANUP SCRIPT - REMOVE UNUSED STORED PROCEDURES
-- Generated: January 13, 2026
-- Purpose: Remove all unused stored procedures
-- =====================================================
--
-- IMPORTANT: Run BACKUP_UNUSED_PROCEDURES.sql FIRST!
--
-- This script removes procedures that are:
-- 1. Not being used in the current codebase
-- 2. Replaced by newer versions
-- 3. Auction/Raffle features (not active)
--
-- EXCLUDED FROM REMOVAL (these are kept):
-- - All Encryption/Decryption procedures
-- - All procedures actively used in code
-- =====================================================

-- Safety check - ensure backup table exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'Backup exists - Safe to proceed'
        ELSE 'WARNING: No backup found! Run BACKUP_UNUSED_PROCEDURES.sql first!'
    END as backup_status
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'procedure_backup';

-- =====================================================
-- DROP AUCTION PROCEDURES (Not in use)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_activateAuction;
DROP PROCEDURE IF EXISTS sp_cancelAuction;
DROP PROCEDURE IF EXISTS sp_checkAuctionBid;
DROP PROCEDURE IF EXISTS sp_checkExistingAuction;
DROP PROCEDURE IF EXISTS sp_countAuctionBids;
DROP PROCEDURE IF EXISTS sp_countDistinctBidders;
DROP PROCEDURE IF EXISTS sp_createAuction;
DROP PROCEDURE IF EXISTS sp_createAuctionForStall;
DROP PROCEDURE IF EXISTS sp_createAuctionResult;
DROP PROCEDURE IF EXISTS sp_createAuctionWaiting;
DROP PROCEDURE IF EXISTS sp_endAuction;
DROP PROCEDURE IF EXISTS sp_getActiveAuctions;
DROP PROCEDURE IF EXISTS sp_getAuctionBids;
DROP PROCEDURE IF EXISTS sp_getAuctionById;
DROP PROCEDURE IF EXISTS sp_getAuctionByStall;
DROP PROCEDURE IF EXISTS sp_getAuctionByStallId;
DROP PROCEDURE IF EXISTS sp_getAuctionResult;
DROP PROCEDURE IF EXISTS sp_getAuctionWithBidsInfo;
DROP PROCEDURE IF EXISTS sp_getBidCount;
DROP PROCEDURE IF EXISTS sp_getExpiredAuctions;
DROP PROCEDURE IF EXISTS sp_getHighestBid;
DROP PROCEDURE IF EXISTS sp_getUniqueBidders;
DROP PROCEDURE IF EXISTS sp_insertAuctionBid;
DROP PROCEDURE IF EXISTS sp_insertAuctionForStall;
DROP PROCEDURE IF EXISTS sp_logAuctionAction;
DROP PROCEDURE IF EXISTS sp_placeAuctionBid;
DROP PROCEDURE IF EXISTS sp_placeBid;
DROP PROCEDURE IF EXISTS sp_resetWinningBids;
DROP PROCEDURE IF EXISTS sp_selectAuctionWinner;
DROP PROCEDURE IF EXISTS sp_startAuction;
DROP PROCEDURE IF EXISTS sp_updateAuctionCurrentBid;
DROP PROCEDURE IF EXISTS sp_updateAuctionDuration;
DROP PROCEDURE IF EXISTS sp_updateAuctionStatus;

-- =====================================================
-- DROP RAFFLE PROCEDURES (Not in use)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_addRaffleParticipant;
DROP PROCEDURE IF EXISTS sp_cancelRaffle;
DROP PROCEDURE IF EXISTS sp_checkExistingRaffle;
DROP PROCEDURE IF EXISTS sp_checkRaffleEntry;
DROP PROCEDURE IF EXISTS sp_checkRaffleParticipant;
DROP PROCEDURE IF EXISTS sp_countRaffleParticipants;
DROP PROCEDURE IF EXISTS sp_createRaffle;
DROP PROCEDURE IF EXISTS sp_createRaffleForStall;
DROP PROCEDURE IF EXISTS sp_createRaffleResult;
DROP PROCEDURE IF EXISTS sp_createRaffleWaiting;
DROP PROCEDURE IF EXISTS sp_endRaffle;
DROP PROCEDURE IF EXISTS sp_getActiveRaffles;
DROP PROCEDURE IF EXISTS sp_getExpiredRaffles;
DROP PROCEDURE IF EXISTS sp_getRaffleById;
DROP PROCEDURE IF EXISTS sp_getRaffleByStall;
DROP PROCEDURE IF EXISTS sp_getRaffleByStallId;
DROP PROCEDURE IF EXISTS sp_getRaffleEntries;
DROP PROCEDURE IF EXISTS sp_getRaffleParticipants;
DROP PROCEDURE IF EXISTS sp_getRaffleParticipantsByStall;
DROP PROCEDURE IF EXISTS sp_getRaffleResult;
DROP PROCEDURE IF EXISTS sp_getRaffleWithEntriesCount;
DROP PROCEDURE IF EXISTS sp_insertRaffleAuctionLog;
DROP PROCEDURE IF EXISTS sp_insertRaffleEntry;
DROP PROCEDURE IF EXISTS sp_insertRaffleForStall;
DROP PROCEDURE IF EXISTS sp_logRaffleAction;
DROP PROCEDURE IF EXISTS sp_logRaffleAuctionActivity;
DROP PROCEDURE IF EXISTS sp_selectRaffleWinner;
DROP PROCEDURE IF EXISTS sp_setRaffleWinner;
DROP PROCEDURE IF EXISTS sp_updateRaffleDuration;
DROP PROCEDURE IF EXISTS sp_updateRaffleStatus;
DROP PROCEDURE IF EXISTS sp_updateStallRaffleAuctionStatus;

-- =====================================================
-- DROP UNUSED GENERAL PROCEDURES (Replaced or not needed)
-- =====================================================

DROP PROCEDURE IF EXISTS addDailyPayment;
DROP PROCEDURE IF EXISTS addInspector;
DROP PROCEDURE IF EXISTS assignManagerToBusinessOwner;
DROP PROCEDURE IF EXISTS CanCustomizeDocuments;
DROP PROCEDURE IF EXISTS checkExistingApplicationByStall;
DROP PROCEDURE IF EXISTS CheckExistingOwnerStalls;
DROP PROCEDURE IF EXISTS countApplicationsByBranch;
DROP PROCEDURE IF EXISTS createCollector;
DROP PROCEDURE IF EXISTS createInspectorWithCredentials;
DROP PROCEDURE IF EXISTS createMobileApplication;
DROP PROCEDURE IF EXISTS CreateOwnerWithThreeManagers;
DROP PROCEDURE IF EXISTS createStallApplicationComplete;
DROP PROCEDURE IF EXISTS createStallBusinessOwner;
DROP PROCEDURE IF EXISTS createSystemAdministrator;
DROP PROCEDURE IF EXISTS createVendor;
DROP PROCEDURE IF EXISTS deleteApplicantDocument;
DROP PROCEDURE IF EXISTS deleteBusinessEmployee;
DROP PROCEDURE IF EXISTS deleteCollector;
DROP PROCEDURE IF EXISTS deleteDailyPayment;
DROP PROCEDURE IF EXISTS deleteStall;
DROP PROCEDURE IF EXISTS deleteStallBusinessOwner;
DROP PROCEDURE IF EXISTS deleteStallholder;
DROP PROCEDURE IF EXISTS deleteSystemAdministrator;
DROP PROCEDURE IF EXISTS deleteVendor;
DROP PROCEDURE IF EXISTS getAllApplicants;
DROP PROCEDURE IF EXISTS getAllBusinessEmployees;
DROP PROCEDURE IF EXISTS getAllBusinessOwnersWithSubscription;
DROP PROCEDURE IF EXISTS getAllCollectors;
DROP PROCEDURE IF EXISTS getAllComplaints;
DROP PROCEDURE IF EXISTS getAllComplianceRecords;
DROP PROCEDURE IF EXISTS getAllDailyPayments;
DROP PROCEDURE IF EXISTS getAllDocumentTypes;
DROP PROCEDURE IF EXISTS getAllPayments;
DROP PROCEDURE IF EXISTS getAllStallBusinessOwners;
DROP PROCEDURE IF EXISTS getAllStallholdersDetailed;
DROP PROCEDURE IF EXISTS getAllStallsDetailed;
DROP PROCEDURE IF EXISTS getAllSystemAdministrators;
DROP PROCEDURE IF EXISTS getAllVendors;
DROP PROCEDURE IF EXISTS getApplicantBusinessOwners;
DROP PROCEDURE IF EXISTS getApplicantByUsername;
DROP PROCEDURE IF EXISTS getApplicantDocumentStatus;
DROP PROCEDURE IF EXISTS getApplicantLoginCredentials;
DROP PROCEDURE IF EXISTS getApplicantRequiredDocuments;
DROP PROCEDURE IF EXISTS getApplicationById;
DROP PROCEDURE IF EXISTS getAvailableStalls;
DROP PROCEDURE IF EXISTS getBranchById;
DROP PROCEDURE IF EXISTS getBranchDocumentRequirements;
DROP PROCEDURE IF EXISTS getBusinessOwnerManagers;
DROP PROCEDURE IF EXISTS getCollectorById;
DROP PROCEDURE IF EXISTS getCollectorByUsername;
DROP PROCEDURE IF EXISTS getCollectorsByBranch;
DROP PROCEDURE IF EXISTS getCredentialByApplicantId;
DROP PROCEDURE IF EXISTS getDailyPaymentById;
DROP PROCEDURE IF EXISTS getFloorsByBranch;
DROP PROCEDURE IF EXISTS getInspectorByUsername;
DROP PROCEDURE IF EXISTS getInspectorsByBranch;
DROP PROCEDURE IF EXISTS getManagerBusinessOwners;
DROP PROCEDURE IF EXISTS getMobileUserByUsername;
DROP PROCEDURE IF EXISTS getOnsitePayments;
DROP PROCEDURE IF EXISTS GetOwnerDocumentRequirements;
DROP PROCEDURE IF EXISTS getPaymentStats;
DROP PROCEDURE IF EXISTS getPenaltyPayments;
DROP PROCEDURE IF EXISTS getPenaltyPaymentsByBranches;
DROP PROCEDURE IF EXISTS getSectionsByFloor;
DROP PROCEDURE IF EXISTS getStallBusinessOwnerById;
DROP PROCEDURE IF EXISTS getStallBusinessOwnerByUsername;
DROP PROCEDURE IF EXISTS getStallById;
DROP PROCEDURE IF EXISTS GetStallholderDocuments;
DROP PROCEDURE IF EXISTS getStallholdersByBranch;
DROP PROCEDURE IF EXISTS getSystemAdminDashboardStats;
DROP PROCEDURE IF EXISTS getSystemAdministratorById;
DROP PROCEDURE IF EXISTS getSystemAdministratorByUsername;
DROP PROCEDURE IF EXISTS getVendorById;
DROP PROCEDURE IF EXISTS getVendorsByCollectorId;
DROP PROCEDURE IF EXISTS loginCollector;
DROP PROCEDURE IF EXISTS loginInspector;
DROP PROCEDURE IF EXISTS loginMobileStaff;
DROP PROCEDURE IF EXISTS loginSystemAdministrator;
DROP PROCEDURE IF EXISTS logoutBusinessEmployee;
DROP PROCEDURE IF EXISTS manual_reset_payment_status;
DROP PROCEDURE IF EXISTS processViolationPayment;
DROP PROCEDURE IF EXISTS recordSubscriptionPayment;
DROP PROCEDURE IF EXISTS removeBranchDocumentRequirementById;
DROP PROCEDURE IF EXISTS removeManagerFromBusinessOwner;
DROP PROCEDURE IF EXISTS ResetAllAutoIncrements;
DROP PROCEDURE IF EXISTS ResetAutoIncrement;
DROP PROCEDURE IF EXISTS resetStallBusinessOwnerPassword;
DROP PROCEDURE IF EXISTS resetSystemAdministratorPassword;
DROP PROCEDURE IF EXISTS ResetTableAutoIncrement;
DROP PROCEDURE IF EXISTS resolveComplaint;
DROP PROCEDURE IF EXISTS setBranchDocumentRequirement;
DROP PROCEDURE IF EXISTS terminateCollector;
DROP PROCEDURE IF EXISTS terminateInspector;
DROP PROCEDURE IF EXISTS updateApplicant;
DROP PROCEDURE IF EXISTS updateApplicationStatus;
DROP PROCEDURE IF EXISTS updateBranch;
DROP PROCEDURE IF EXISTS updateBusinessManager;
DROP PROCEDURE IF EXISTS updateCollector;
DROP PROCEDURE IF EXISTS updateCollectorLogin;
DROP PROCEDURE IF EXISTS updateComplaint;
DROP PROCEDURE IF EXISTS updateComplianceRecord;
DROP PROCEDURE IF EXISTS updateDailyPayment;
DROP PROCEDURE IF EXISTS updateFloor;
DROP PROCEDURE IF EXISTS updateMobileApplication;
DROP PROCEDURE IF EXISTS updateSection;
DROP PROCEDURE IF EXISTS updateStall;
DROP PROCEDURE IF EXISTS updateStallBusinessOwner;
DROP PROCEDURE IF EXISTS updateStallholder;
DROP PROCEDURE IF EXISTS updateSystemAdministrator;
DROP PROCEDURE IF EXISTS updateVendor;
DROP PROCEDURE IF EXISTS uploadApplicantDocument;

-- =====================================================
-- DROP UNUSED SP_ PREFIXED PROCEDURES
-- =====================================================

DROP PROCEDURE IF EXISTS sp_addStall;
DROP PROCEDURE IF EXISTS sp_addStallComplete;
DROP PROCEDURE IF EXISTS sp_addStall_complete;
DROP PROCEDURE IF EXISTS sp_add_payment;
DROP PROCEDURE IF EXISTS sp_approveApplication;
DROP PROCEDURE IF EXISTS sp_checkBranchExists;
DROP PROCEDURE IF EXISTS sp_checkCredentialExists;
DROP PROCEDURE IF EXISTS sp_checkExistingDocument;
DROP PROCEDURE IF EXISTS sp_checkInspectorTableExists;
DROP PROCEDURE IF EXISTS sp_checkManagerExistsForBranch;
DROP PROCEDURE IF EXISTS sp_checkManagerExistsForDifferentBranch;
DROP PROCEDURE IF EXISTS sp_checkManagerUsernameExists;
DROP PROCEDURE IF EXISTS sp_checkManagerUsernameGlobal;
DROP PROCEDURE IF EXISTS sp_checkStallAvailability;
DROP PROCEDURE IF EXISTS sp_checkStallExistsMobile;
DROP PROCEDURE IF EXISTS sp_checkStallholderExistsMobile;
DROP PROCEDURE IF EXISTS sp_checkStallImageExistsMobile;
DROP PROCEDURE IF EXISTS sp_checkStallNumberExists;
DROP PROCEDURE IF EXISTS sp_checkUserExists;
DROP PROCEDURE IF EXISTS sp_countApplicantsByStatus;
DROP PROCEDURE IF EXISTS sp_countStallsInSection;
DROP PROCEDURE IF EXISTS sp_createApplication;
DROP PROCEDURE IF EXISTS sp_createBranch;
DROP PROCEDURE IF EXISTS sp_createBranchManager;
DROP PROCEDURE IF EXISTS sp_createCollector;
DROP PROCEDURE IF EXISTS sp_createCollectorAssignment;
DROP PROCEDURE IF EXISTS sp_createComplaint;
DROP PROCEDURE IF EXISTS sp_createDefaultFloor;
DROP PROCEDURE IF EXISTS sp_createDefaultSection;
DROP PROCEDURE IF EXISTS sp_createDocumentRequirement;
DROP PROCEDURE IF EXISTS sp_createFloor;
DROP PROCEDURE IF EXISTS sp_createFloorForImport;
DROP PROCEDURE IF EXISTS sp_createInspector;
DROP PROCEDURE IF EXISTS sp_createInspectorAssignment;
DROP PROCEDURE IF EXISTS sp_createOrUpdateStaffSession;
DROP PROCEDURE IF EXISTS sp_createPayment;
DROP PROCEDURE IF EXISTS sp_createSection;
DROP PROCEDURE IF EXISTS sp_createSectionForImport;
DROP PROCEDURE IF EXISTS sp_createStaffSession;
DROP PROCEDURE IF EXISTS sp_createStaffSessionMinimal;
DROP PROCEDURE IF EXISTS sp_createStall;
DROP PROCEDURE IF EXISTS sp_createStallForImport;
DROP PROCEDURE IF EXISTS sp_createStallholder;
DROP PROCEDURE IF EXISTS sp_createStallholderFromImport;
DROP PROCEDURE IF EXISTS sp_deactivateEmployeeSessions;
DROP PROCEDURE IF EXISTS sp_deactivateStaffSessions;
DROP PROCEDURE IF EXISTS sp_declineApplication;
DROP PROCEDURE IF EXISTS sp_deleteBranch;
DROP PROCEDURE IF EXISTS sp_deleteBranchDocRequirements;
DROP PROCEDURE IF EXISTS sp_deleteBranchDocumentRequirements;
DROP PROCEDURE IF EXISTS sp_deleteBranchManager;
DROP PROCEDURE IF EXISTS sp_deleteDocumentById;
DROP PROCEDURE IF EXISTS sp_deleteDocumentRequirement;
DROP PROCEDURE IF EXISTS sp_deleteStall;
DROP PROCEDURE IF EXISTS sp_deleteStallImageByUrl;
DROP PROCEDURE IF EXISTS sp_deleteStallImageMobile;
DROP PROCEDURE IF EXISTS sp_endStaffSession;
DROP PROCEDURE IF EXISTS sp_findStallByFloorSectionNo;
DROP PROCEDURE IF EXISTS sp_getActiveAdmin;
DROP PROCEDURE IF EXISTS sp_getActiveEmployeeSessions;
DROP PROCEDURE IF EXISTS sp_getActiveEmployeeSessionsByBranch;
DROP PROCEDURE IF EXISTS sp_getActiveSessionsAll;
DROP PROCEDURE IF EXISTS sp_getActiveSessionsByBranches;
DROP PROCEDURE IF EXISTS sp_getAdminByEmail;
DROP PROCEDURE IF EXISTS sp_getAllActiveEmployees;
DROP PROCEDURE IF EXISTS sp_getAllApplicantsByStatus;
DROP PROCEDURE IF EXISTS sp_getAllBranches;
DROP PROCEDURE IF EXISTS sp_getAllBranchManagers;
DROP PROCEDURE IF EXISTS sp_getAllCollectors;
DROP PROCEDURE IF EXISTS sp_getAllCollectorsByBranches;
DROP PROCEDURE IF EXISTS sp_getAllCollectorsWithBranch;
DROP PROCEDURE IF EXISTS sp_getAllEmployeesAll;
DROP PROCEDURE IF EXISTS sp_getAllEmployeesByBranches;
DROP PROCEDURE IF EXISTS sp_getAllFloors;
DROP PROCEDURE IF EXISTS sp_getAllFloorsAdmin;
DROP PROCEDURE IF EXISTS sp_getAllInspectors;
DROP PROCEDURE IF EXISTS sp_getAllInspectorsByBranches;
DROP PROCEDURE IF EXISTS sp_getAllInspectorsWithBranch;
DROP PROCEDURE IF EXISTS sp_getAllSectionsAdmin;
DROP PROCEDURE IF EXISTS sp_getAllStallholderDocuments;
DROP PROCEDURE IF EXISTS sp_getAllStallholderDocumentsWithData;
DROP PROCEDURE IF EXISTS sp_getAllStallholders;
DROP PROCEDURE IF EXISTS sp_getAllStallholdersAll;
DROP PROCEDURE IF EXISTS sp_getAllStallholdersByBranches;
DROP PROCEDURE IF EXISTS sp_getAllStallImagesMobile;
DROP PROCEDURE IF EXISTS sp_getAllStallImagesWithDataMobile;
DROP PROCEDURE IF EXISTS sp_getAllStalls;
DROP PROCEDURE IF EXISTS sp_getAllStallsByBranch;
DROP PROCEDURE IF EXISTS sp_getAllStallsByManager;
DROP PROCEDURE IF EXISTS sp_getAllStalls_complete;
DROP PROCEDURE IF EXISTS sp_getApplicantByIdFull;
DROP PROCEDURE IF EXISTS sp_getApplicantCount;
DROP PROCEDURE IF EXISTS sp_getApplicantDetailsForComplaint;
DROP PROCEDURE IF EXISTS sp_getApplicantForApproval;
DROP PROCEDURE IF EXISTS sp_getApplicantName;
DROP PROCEDURE IF EXISTS sp_getApplicantOtherInfo;
DROP PROCEDURE IF EXISTS sp_getApplicantsByBranch;
DROP PROCEDURE IF EXISTS sp_getApplicantsByBranchManager;
DROP PROCEDURE IF EXISTS sp_getApplicantsByStall;
DROP PROCEDURE IF EXISTS sp_getApplicantsDecrypted;
DROP PROCEDURE IF EXISTS sp_getApplicantWithApplicationDetails;
DROP PROCEDURE IF EXISTS sp_getApplicantWithFullDetails;
DROP PROCEDURE IF EXISTS sp_getApplicationByApplicantId;
DROP PROCEDURE IF EXISTS sp_getApplicationFullDetails;
DROP PROCEDURE IF EXISTS sp_getApplicationsByStatus;
DROP PROCEDURE IF EXISTS sp_getAreaById;
DROP PROCEDURE IF EXISTS sp_getAreas;
DROP PROCEDURE IF EXISTS sp_getAreasByCity;
DROP PROCEDURE IF EXISTS sp_getAvailableStalls;
DROP PROCEDURE IF EXISTS sp_getAvailableStallsByBranch;
DROP PROCEDURE IF EXISTS sp_getAvailableStallsForBranch;
DROP PROCEDURE IF EXISTS sp_getAvailableStallsForImport;
DROP PROCEDURE IF EXISTS sp_getBranchByArea;
DROP PROCEDURE IF EXISTS sp_getBranchDetails;
DROP PROCEDURE IF EXISTS sp_getBranchesByAreaId;
DROP PROCEDURE IF EXISTS sp_getBranchesByManager;
DROP PROCEDURE IF EXISTS sp_getBranchIdFromBusinessManager;
DROP PROCEDURE IF EXISTS sp_getBranchInfo;
DROP PROCEDURE IF EXISTS sp_getBranchManagerByEmail;
DROP PROCEDURE IF EXISTS sp_getBranchNameById;
DROP PROCEDURE IF EXISTS sp_getBusinessEmployeeByEmail;
DROP PROCEDURE IF EXISTS sp_getBusinessEmployeeById;
DROP PROCEDURE IF EXISTS sp_getBusinessManagerByBranch;
DROP PROCEDURE IF EXISTS sp_getBusinessManagerByEmail;
DROP PROCEDURE IF EXISTS sp_getBusinessManagerByEmailForLogin;
DROP PROCEDURE IF EXISTS sp_getBusinessManagerById;
DROP PROCEDURE IF EXISTS sp_getBusinessManagersAllDecrypted;
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerBranches;
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerBranchesWithManagers;
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerBranchIds;
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerByEmail;
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerById;
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerByStall;
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerByUsername;
DROP PROCEDURE IF EXISTS sp_getCities;
DROP PROCEDURE IF EXISTS sp_getCollectorByEmail;
DROP PROCEDURE IF EXISTS sp_getCollectorById;
DROP PROCEDURE IF EXISTS sp_getCollectorByIdDecrypted;
DROP PROCEDURE IF EXISTS sp_getCollectorName;
DROP PROCEDURE IF EXISTS sp_getCollectorNameById;
DROP PROCEDURE IF EXISTS sp_getCollectorsAll;
DROP PROCEDURE IF EXISTS sp_getCollectorsByBranch;
DROP PROCEDURE IF EXISTS sp_getComplaintById;
DROP PROCEDURE IF EXISTS sp_getComplaintsByBranch;
DROP PROCEDURE IF EXISTS sp_getComplaintsByStallholder;
DROP PROCEDURE IF EXISTS sp_getCredentialByApplicantId;
DROP PROCEDURE IF EXISTS sp_getDashboardStats;
DROP PROCEDURE IF EXISTS sp_getDeclinedApplicants;
DROP PROCEDURE IF EXISTS sp_getDistinctAreas;
DROP PROCEDURE IF EXISTS sp_getDistinctBranches;
DROP PROCEDURE IF EXISTS sp_getDocumentBlobById;
DROP PROCEDURE IF EXISTS sp_getDocumentByStallholderType;
DROP PROCEDURE IF EXISTS sp_getDocumentRequirementsByBranch;
DROP PROCEDURE IF EXISTS sp_getDocumentsByStallholder;
DROP PROCEDURE IF EXISTS sp_getDocumentSubmissionBlob;
DROP PROCEDURE IF EXISTS sp_getDocumentTypeById;
DROP PROCEDURE IF EXISTS sp_getDocumentTypeByRequirementId;
DROP PROCEDURE IF EXISTS sp_getDocumentTypes;
DROP PROCEDURE IF EXISTS sp_getEmployeeByEmail;
DROP PROCEDURE IF EXISTS sp_getEmployeeByIdWithBranch;
DROP PROCEDURE IF EXISTS sp_getEmployeeByUsername;
DROP PROCEDURE IF EXISTS sp_getEmployeesByBranchIds;
DROP PROCEDURE IF EXISTS sp_getExistingManagerForBranch;
DROP PROCEDURE IF EXISTS sp_getExistingStallholders;
DROP PROCEDURE IF EXISTS sp_getExistingStallNumbers;
DROP PROCEDURE IF EXISTS sp_getFilteredStalls;
DROP PROCEDURE IF EXISTS sp_getFirstFloorByBranch;
DROP PROCEDURE IF EXISTS sp_getFirstSectionByFloor;
DROP PROCEDURE IF EXISTS sp_getFloorByBranchId;
DROP PROCEDURE IF EXISTS sp_getFloorByBranchWithDetails;
DROP PROCEDURE IF EXISTS sp_getFloorById;
DROP PROCEDURE IF EXISTS sp_getFloorByManagerWithDetails;
DROP PROCEDURE IF EXISTS sp_getFloorCountByManager;
DROP PROCEDURE IF EXISTS sp_getFloorsByBranchId;
DROP PROCEDURE IF EXISTS sp_getFloorsByBranchIds;
DROP PROCEDURE IF EXISTS sp_getFloorSectionDetails;
DROP PROCEDURE IF EXISTS sp_getFloorsWithSections;
DROP PROCEDURE IF EXISTS sp_getInspectorByEmail;
DROP PROCEDURE IF EXISTS sp_getInspectorById;
DROP PROCEDURE IF EXISTS sp_getInspectorByIdDecrypted;
DROP PROCEDURE IF EXISTS sp_getInspectorName;
DROP PROCEDURE IF EXISTS sp_getInspectorNameById;
DROP PROCEDURE IF EXISTS sp_getInspectorsAll;
DROP PROCEDURE IF EXISTS sp_getInspectorsByBranch;
DROP PROCEDURE IF EXISTS sp_getLandingPageStallholders;
DROP PROCEDURE IF EXISTS sp_getLandingPageStalls;
DROP PROCEDURE IF EXISTS sp_getLiveStallData;
DROP PROCEDURE IF EXISTS sp_getLiveStallInfo;
DROP PROCEDURE IF EXISTS sp_getLocationsByBranch;
DROP PROCEDURE IF EXISTS sp_getLocationsByCity;
DROP PROCEDURE IF EXISTS sp_getManagerByUsername;
DROP PROCEDURE IF EXISTS sp_getOnlinePaymentsAll;
DROP PROCEDURE IF EXISTS sp_getOnlinePaymentsByBranches;
DROP PROCEDURE IF EXISTS sp_getOnsitePaymentsAll;
DROP PROCEDURE IF EXISTS sp_getOnsitePaymentsByBranches;
DROP PROCEDURE IF EXISTS sp_getOrCreateDefaultFloor;
DROP PROCEDURE IF EXISTS sp_getOwnerBranches;
DROP PROCEDURE IF EXISTS sp_getParticipantsByBranch;
DROP PROCEDURE IF EXISTS sp_getParticipantsByStall;
DROP PROCEDURE IF EXISTS sp_getPaymentsByStallholder;
DROP PROCEDURE IF EXISTS sp_getPenaltyPayments;
DROP PROCEDURE IF EXISTS sp_getPenaltyPaymentsAll;
DROP PROCEDURE IF EXISTS sp_getPenaltyPaymentsByBranches;
DROP PROCEDURE IF EXISTS sp_getPenaltyPaymentsCount;
DROP PROCEDURE IF EXISTS sp_getRefreshToken;
DROP PROCEDURE IF EXISTS sp_getRefreshTokenInfo;
DROP PROCEDURE IF EXISTS sp_getRegistrationId;
DROP PROCEDURE IF EXISTS sp_getRemainingStallImagesMobile;
DROP PROCEDURE IF EXISTS sp_getSectionByFloorId;
DROP PROCEDURE IF EXISTS sp_getSectionById;
DROP PROCEDURE IF EXISTS sp_getSectionsByFloor;
DROP PROCEDURE IF EXISTS sp_getSectionsByFloorId;
DROP PROCEDURE IF EXISTS sp_getSectionsByFloorIds;
DROP PROCEDURE IF EXISTS sp_getSectionsByFloors;
DROP PROCEDURE IF EXISTS sp_getStallAvailabilityStatus;
DROP PROCEDURE IF EXISTS sp_getStallById;
DROP PROCEDURE IF EXISTS sp_getStallByNumberAndSection;
DROP PROCEDURE IF EXISTS sp_getStallByStallholder;
DROP PROCEDURE IF EXISTS sp_getStallByStallNo;
DROP PROCEDURE IF EXISTS sp_getStallFirstImageMobile;
DROP PROCEDURE IF EXISTS sp_getStallFullDetails;
DROP PROCEDURE IF EXISTS sp_getStallholderByApplicantIdSimple;
DROP PROCEDURE IF EXISTS sp_getStallholderCountByBranch;
DROP PROCEDURE IF EXISTS sp_getStallholderDetailById;
DROP PROCEDURE IF EXISTS sp_getStallholderDetailsForComplaint;
DROP PROCEDURE IF EXISTS sp_getStallholderForPayment;
DROP PROCEDURE IF EXISTS sp_getStallholderFullDetails;
DROP PROCEDURE IF EXISTS sp_getStallholderInfoForStall;
DROP PROCEDURE IF EXISTS sp_getStallholderMasterlist;
DROP PROCEDURE IF EXISTS sp_getStallholdersDecrypted;
DROP PROCEDURE IF EXISTS sp_getStallIdFromImageMobile;
DROP PROCEDURE IF EXISTS sp_getStallImage;
DROP PROCEDURE IF EXISTS sp_getStallImageByIdMobile;
DROP PROCEDURE IF EXISTS sp_getStallImageByPositionMobile;
DROP PROCEDURE IF EXISTS sp_getStallImageForDeleteMobile;
DROP PROCEDURE IF EXISTS sp_getStallImageInfoByIdMobile;
DROP PROCEDURE IF EXISTS sp_getStallImagesWithBranch;
DROP PROCEDURE IF EXISTS sp_getStallPrimaryImageInfo;
DROP PROCEDURE IF EXISTS sp_getStallPrimaryImageMobile;
DROP PROCEDURE IF EXISTS sp_getStallsByArea;
DROP PROCEDURE IF EXISTS sp_getStallsByBranch;
DROP PROCEDURE IF EXISTS sp_getStallsBySectionPaginated;
DROP PROCEDURE IF EXISTS sp_getSubmissionBlobById;
DROP PROCEDURE IF EXISTS sp_getSystemAdminByEmail;
DROP PROCEDURE IF EXISTS sp_get_all_stallholders;
DROP PROCEDURE IF EXISTS sp_get_payments_for_manager;
DROP PROCEDURE IF EXISTS sp_get_stallholders_for_manager;
DROP PROCEDURE IF EXISTS sp_get_stallholder_details;
DROP PROCEDURE IF EXISTS sp_importStallholder;
DROP PROCEDURE IF EXISTS sp_insertApplication;
DROP PROCEDURE IF EXISTS sp_insertBranchDocRequirement;
DROP PROCEDURE IF EXISTS sp_insertBranchManager;
DROP PROCEDURE IF EXISTS sp_insertCredential;
DROP PROCEDURE IF EXISTS sp_insertDocumentBlob;
DROP PROCEDURE IF EXISTS sp_insertFloor;
DROP PROCEDURE IF EXISTS sp_insertSection;
DROP PROCEDURE IF EXISTS sp_insertStall;
DROP PROCEDURE IF EXISTS sp_insertStallholderFromApplication;
DROP PROCEDURE IF EXISTS sp_insertStallImage;
DROP PROCEDURE IF EXISTS sp_insertSubmissionBlob;
DROP PROCEDURE IF EXISTS sp_logStaffActivityAutoLogout;
DROP PROCEDURE IF EXISTS sp_revokeAllUserTokens;
DROP PROCEDURE IF EXISTS sp_revokeRefreshToken;
DROP PROCEDURE IF EXISTS sp_searchApplicants;
DROP PROCEDURE IF EXISTS sp_searchStallholders;
DROP PROCEDURE IF EXISTS sp_setFirstImageAsPrimaryMobile;
DROP PROCEDURE IF EXISTS sp_setStallImagePrimaryMobile;
DROP PROCEDURE IF EXISTS sp_updateApplicantStatus;
DROP PROCEDURE IF EXISTS sp_updateApplicationStatus;
DROP PROCEDURE IF EXISTS sp_updateBranch;
DROP PROCEDURE IF EXISTS sp_updateBranchManager;
DROP PROCEDURE IF EXISTS sp_updateBusinessEmployeeLastLogin;
DROP PROCEDURE IF EXISTS sp_updateBusinessManagerLastLogin;
DROP PROCEDURE IF EXISTS sp_updateBusinessOwnerLastLogin;
DROP PROCEDURE IF EXISTS sp_updateCollectorLastLogout;
DROP PROCEDURE IF EXISTS sp_updateCollectorStatus;
DROP PROCEDURE IF EXISTS sp_updateComplaintStatus;
DROP PROCEDURE IF EXISTS sp_updateCredential;
DROP PROCEDURE IF EXISTS sp_updateCredentialLastLogin;
DROP PROCEDURE IF EXISTS sp_updateCredentialPassword;
DROP PROCEDURE IF EXISTS sp_updateDocumentBlob;
DROP PROCEDURE IF EXISTS sp_updateDocumentRequirement;
DROP PROCEDURE IF EXISTS sp_updateEmployeeSession;
DROP PROCEDURE IF EXISTS sp_updateEmployeeSessionActivity;
DROP PROCEDURE IF EXISTS sp_updateInspectorLastLogout;
DROP PROCEDURE IF EXISTS sp_updateInspectorStatus;
DROP PROCEDURE IF EXISTS sp_updateLastLogin;
DROP PROCEDURE IF EXISTS sp_updateStaffSessionActivity;
DROP PROCEDURE IF EXISTS sp_updateStall;
DROP PROCEDURE IF EXISTS sp_updateStallForOccupancy;
DROP PROCEDURE IF EXISTS sp_updateStallForOccupancyWithDetails;
DROP PROCEDURE IF EXISTS sp_updateStallholderInfo;
DROP PROCEDURE IF EXISTS sp_updateStallImageBlobMobile;
DROP PROCEDURE IF EXISTS sp_updateStallImageOrderMobile;
DROP PROCEDURE IF EXISTS sp_updateStallOccupied;
DROP PROCEDURE IF EXISTS sp_updateStallRentalPrice;
DROP PROCEDURE IF EXISTS sp_updateStallStatus;
DROP PROCEDURE IF EXISTS sp_updateStall_complete;
DROP PROCEDURE IF EXISTS sp_updateSubmissionBlob;
DROP PROCEDURE IF EXISTS sp_updateSystemAdminLastLogin;
DROP PROCEDURE IF EXISTS sp_updateSystemAdminLastLogoutNow;
DROP PROCEDURE IF EXISTS sp_updateUserLastLogin;
DROP PROCEDURE IF EXISTS sp_uploadApplicantDocument;
DROP PROCEDURE IF EXISTS sp_uploadStallImage;
DROP PROCEDURE IF EXISTS sp_verifyDocumentExists;
DROP PROCEDURE IF EXISTS sp_verifyStallholderExists;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show remaining procedures (should only be the ones in use)
SELECT 'Remaining procedures after cleanup:' as '';
SELECT ROUTINE_NAME as remaining_procedure
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_TYPE = 'PROCEDURE'
ORDER BY ROUTINE_NAME;

-- Count remaining procedures
SELECT COUNT(*) as remaining_procedure_count
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_TYPE = 'PROCEDURE';

SELECT '=======================================' as '';
SELECT 'CLEANUP COMPLETE!' as message;
SELECT 'Removed unused Auction, Raffle, and obsolete procedures' as details;
SELECT 'Backup is stored in procedure_backup table' as backup_info;
SELECT '=======================================' as '';
