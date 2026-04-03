const { validationResult } = require("express-validator");
const { sendError } = require("../utils/response");

/**
 * Reads results from express-validator and returns a 422 if any fail.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return sendError(res, 422, "Validation failed.", { errors: messages });
  }
  next();
};

module.exports = { validate };
