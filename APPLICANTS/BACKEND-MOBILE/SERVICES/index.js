/**
 * APPLICANTS - Mobile Backend Services Index
 * Central export for all applicant mobile services
 */

import applicationService, {
  submitApplication,
  getApplicationsByApplicant,
  getApplicationStatus
} from './applicationService.js';

export {
  applicationService,
  submitApplication,
  getApplicationsByApplicant,
  getApplicationStatus
};

export default applicationService;
