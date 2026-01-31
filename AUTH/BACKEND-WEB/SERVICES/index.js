/**
 * AUTH - Web Backend Services Index
 * Central export for all web authentication services
 */

import authService, {
  validateWebUserCredentials,
  generateWebToken,
  verifyWebToken,
  decryptSensitiveData
} from './authService.js';

export {
  authService,
  validateWebUserCredentials,
  generateWebToken,
  verifyWebToken,
  decryptSensitiveData
};

export default authService;
