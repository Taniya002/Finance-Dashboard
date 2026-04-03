const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const { sendError } = require("../utils/response");

/**
 * Verifies the JWT token and attaches the user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "Authentication required. Please log in.");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 401, "User no longer exists.");
    }

    if (!user.isActive) {
      return sendError(res, 403, "Your account has been deactivated.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return sendError(res, 401, "Invalid token.");
    }
    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Token expired. Please log in again.");
    }
    next(error);
  }
};

/**
 * Role-based access control middleware factory.
 * Usage: authorize("admin") or authorize("admin", "analyst")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required.");
    }
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Required role(s): ${roles.join(", ")}.`
      );
    }
    next();
  };
};

module.exports = { authenticate, authorize };
