/**
 * AUTH - Mobile Backend Services Index
 * Central export for all authentication services
 */

import authService, {
  validateUserCredentials,
  generateMobileToken,
  verifyMobileToken,
  decryptUserData
} from './authService.js';

export {
  authService,
  validateUserCredentials,
  generateMobileToken,
  verifyMobileToken,
  decryptUserData
};

export default authService;
