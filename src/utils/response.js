/**
 * Standardised API response helpers.
 * All responses follow the shape: { success, message, data? }
 */

const sendSuccess = (res, statusCode = 200, message = "Success", data = {}) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const sendError = (res, statusCode = 500, message = "Error", data = {}) => {
  return res.status(statusCode).json({ success: false, message, ...data });
};

module.exports = { sendSuccess, sendError };
