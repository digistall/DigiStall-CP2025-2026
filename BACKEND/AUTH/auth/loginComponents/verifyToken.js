import jwt from 'jsonwebtoken'
import process from 'process'

// Verify JWT token
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT_SECRET is not set'
      });
    }
    const decoded = jwt.verify(token, jwtSecret);

    res.json({
      success: true,
      message: 'Token is valid',
      user: decoded
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

