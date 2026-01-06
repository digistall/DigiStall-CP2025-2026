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
        console.error("JWT verification error:", err.message);
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Token has expired",
            error: "TOKEN_EXPIRED",
          });
        } else if (err.name === "JsonWebTokenError") {
          return res.status(401).json({
            success: false,
            message: "Invalid token",
            error: "INVALID_TOKEN",
          });
        } else {
          return res.status(401).json({
            success: false,
            message: "Token verification failed",
            error: err.message,
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
        // Legacy support
        type: userType,
        role: userType,
      };

      // Token verified silently

      next();
    }
  );
};

// Role-based authorization middleware
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userType = req.user?.userType || req.user?.role || req.user?.type;

    if (!userType) {
      return res.status(401).json({
        success: false,
        message: "User type not found in token",
      });
    }

    if (!allowedRoles.includes(userType)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
        userRole: userType,
      });
    }

    next();
  };
};

// Admin-only authorization
const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, (error) => {
    if (error) return;

    const userType = req.user?.userType || req.user?.role || req.user?.type;

    if (userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
        userRole: userType,
      });
    }

    next();
  });
};

// Branch manager authorization (includes admin)
const authenticateBranchManager = (req, res, next) => {
  authenticateToken(req, res, (error) => {
    if (error) return;

    const userType = req.user?.userType || req.user?.role || req.user?.type;

    if (!["admin", "branch_manager"].includes(userType)) {
      return res.status(403).json({
        success: false,
        message: "Branch manager or admin access required",
        userRole: userType,
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
  authenticateBranchManager,
  authenticateAdmin,
  authorizeRole,
};