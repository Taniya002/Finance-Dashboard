const { sendError } = require("../utils/response");

/**
 * Catches unhandled errors from the Express pipeline.
 * Must have exactly 4 params for Express to treat it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 422, "Validation failed.", { errors: messages });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, 409, `${field} already exists.`);
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return sendError(res, 400, `Invalid value for field: ${err.path}`);
  }

  // Default 500
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong."
      : err.message;

  sendError(res, statusCode, message);
};

module.exports = { errorHandler };
