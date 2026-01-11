import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-mobile-2024';

/**
 * Middleware to verify JWT token
 */
export const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err.message);
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
      
      // Add user data to request
      req.user = decoded;
      next();
    });
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to verify staff token and staff type
 */
export const verifyStaff = (allowedTypes = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }
      
      const token = authHeader.substring(7);
      
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
          });
        }
        
        // Check if staff type is allowed
        if (allowedTypes.length > 0 && !allowedTypes.includes(decoded.staffType)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied for your staff type'
          });
        }
        
        req.user = decoded;
        next();
      });
      
    } catch (error) {
      console.error('Staff auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
  };
};
