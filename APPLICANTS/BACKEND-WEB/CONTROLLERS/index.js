// ===== APPLICATION CONTROLLERS INDEX =====
// Centralized export for all application-related controllers

import {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getApplicationsByStatus,
  getAllApplicants,
  getApplicantById,
} from './applicationController.js';

// Export as controller object for backward compatibility
export const applicationController = {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getApplicationsByStatus,
  getAllApplicants,
  getApplicantById,
};

// Export individual functions
export {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getApplicationsByStatus,
  getAllApplicants,
  getApplicantById,
};
