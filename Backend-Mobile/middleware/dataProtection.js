const encryptionService = require('../services/encryptionService');

/**
 * Middleware to automatically decrypt response data
 * This intercepts the response and decrypts encrypted fields before sending
 */
const decryptResponseMiddleware = (req, res, next) => {
    // Store the original json method
    const originalJson = res.json.bind(res);
    
    // Override the json method
    res.json = (data) => {
        try {
            // Decrypt the data before sending
            const decryptedData = decryptResponseData(data);
            return originalJson(decryptedData);
        } catch (error) {
            console.error('Error in decrypt middleware:', error);
            // If decryption fails, send original data
            return originalJson(data);
        }
    };
    
    next();
};

/**
 * Recursively decrypt response data
 */
const decryptResponseData = (data) => {
    if (data === null || data === undefined) {
        return data;
    }
    
    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => decryptResponseData(item));
    }
    
    // Handle objects
    if (typeof data === 'object') {
        // Handle pagination response
        if (data.data && Array.isArray(data.data)) {
            return {
                ...data,
                data: decryptResponseData(data.data)
            };
        }
        
        // Handle success response with single object
        if (data.success !== undefined && data.data) {
            return {
                ...data,
                data: decryptResponseData(data.data)
            };
        }
        
        // Decrypt object fields
        const decrypted = { ...data };
        
        for (const [key, value] of Object.entries(decrypted)) {
            if (typeof value === 'string' && encryptionService.isEncrypted(value)) {
                try {
                    decrypted[key] = encryptionService.decryptData(value);
                } catch (error) {
                    // Keep original if decryption fails
                    console.warn(`Failed to decrypt field: ${key}`);
                }
            } else if (typeof value === 'object') {
                decrypted[key] = decryptResponseData(value);
            }
        }
        
        return decrypted;
    }
    
    return data;
};

/**
 * Decrypt user data object
 */
const decryptUserData = (user) => {
    if (!user) return user;
    
    // Determine entity type
    let entityType = 'applicant';
    if (user.inspector_id) entityType = 'inspector';
    if (user.collector_id) entityType = 'collector';
    if (user.branch_manager_id) entityType = 'branchManager';
    if (user.stallholder_id) entityType = 'stallholder';
    if (user.spouse_id) entityType = 'spouse';
    
    return encryptionService.decryptObjectFields(user, entityType);
};

/**
 * Decrypt array of user data
 */
const decryptUsersData = (users) => {
    if (!Array.isArray(users)) return users;
    return users.map(user => decryptUserData(user));
};

/**
 * Middleware to encrypt request body data before processing
 */
const encryptRequestMiddleware = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        // Determine entity type from route
        let entityType = detectEntityType(req.path);
        
        if (entityType) {
            try {
                req.body = encryptionService.encryptObjectFields(req.body, entityType);
            } catch (error) {
                console.error('Error encrypting request data:', error);
            }
        }
    }
    next();
};

/**
 * Detect entity type from request path
 */
const detectEntityType = (path) => {
    if (path.includes('applicant')) return 'applicant';
    if (path.includes('stallholder')) return 'stallholder';
    if (path.includes('inspector')) return 'inspector';
    if (path.includes('collector')) return 'collector';
    if (path.includes('branch-manager') || path.includes('manager')) return 'branchManager';
    if (path.includes('spouse')) return 'spouse';
    if (path.includes('business')) return 'businessInfo';
    if (path.includes('participant')) return 'participant';
    return null;
};

module.exports = {
    decryptResponseMiddleware,
    decryptResponseData,
    decryptUserData,
    decryptUsersData,
    encryptRequestMiddleware
};
