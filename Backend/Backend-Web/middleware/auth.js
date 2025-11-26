import jwt from "jsonwebtoken";
import process from "process";

const { verify } = jwt;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  verify(
    token,
    process.env.JWT_SECRET ||
      "your-super-secret-jwt-key-change-this-in-production",
    (err, decoded) => {
      if (err) {
        console.error("Token verification error:", err);

        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Token expired",
          });
        } else if (err.name === "JsonWebTokenError") {
          return res.status(401).json({
            success: false,
            message: "Invalid token",
          });
        } else {
          return res.status(403).json({
            success: false,
            message: "Token verification failed",
          });
        }
      }

      // Add decoded user information to request
      const userType = decoded.type || decoded.userType || decoded.role;

      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        userType: userType,
        area: decoded.area,
        location: decoded.location,
        branchId: decoded.branchId, // ✅ Add branchId from JWT
        permissions: decoded.permissions, // ✅ Add permissions from JWT
        branchManagerId: decoded.branchManagerId || decoded.userId,
        // Keep legacy role field for backward compatibility
        role: userType, // Use the actual userType instead of defaulting
      };

      console.log("🔍 Authenticated user details:", {
        username: req.user.username,
        userType: req.user.userType,
        role: req.user.role,
        userId: req.user.userId,
        branchId: req.user.branchId, // ✅ Log branchId
        permissions: req.user.permissions, // ✅ Log permissions
      });

      next();
    }
  );
};

// Updated role authorization for naga_stall system
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check both userType and legacy role for compatibility
    const userRole = req.user.userType || req.user.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(
          " or "
        )}, but user has: ${userRole}`,
      });
    }

    next();
  };
};

// Specific middleware for business manager authentication
const authenticateBusinessManager = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);

    if (req.user.userType !== "business_manager") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Business manager access required.",
      });
    }

    // Ensure business manager ID is available for stall filtering
    if (!req.user.businessManagerId) {
      return res.status(400).json({
        success: false,
        message: "Business manager ID not found in token",
      });
    }

    next();
  });
};

// Specific middleware for stall business owner authentication
const authenticateStallBusinessOwner = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);

    if (req.user.userType !== "stall_business_owner") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Stall business owner access required.",
      });
    }

    next();
  });
};

// Specific middleware for system administrator authentication
const authenticateSystemAdministrator = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);

    if (req.user.userType !== "system_administrator") {
      return res.status(403).json({
        success: false,
        message: "Access denied. System administrator access required.",
      });
    }

    next();
  });
};

// General authentication that accepts both admin and branch manager
const authenticateUser = authenticateToken;

export default {
  authenticateToken,
  authenticateUser,
  authenticateBusinessManager,
  authenticateStallBusinessOwner,
  authenticateSystemAdministrator,
  authorizeRole,
};