/**
 * APPLICANTS - Web Backend Services Index
 * Central export for all applicant web services
 */

import applicantService, {
  getAllApplicants,
  decryptApplicantFields,
  approveApplicant,
  declineApplicant
} from './applicantService.js';

export {
  applicantService,
  getAllApplicants,
  decryptApplicantFields,
  approveApplicant,
  declineApplicant
};

export default applicantService;
