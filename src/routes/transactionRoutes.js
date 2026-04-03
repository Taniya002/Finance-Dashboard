const express = require("express");
const { body, param, query } = require("express-validator");
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { ROLES } = require("../models/User");
const { TRANSACTION_TYPES, CATEGORIES } = require("../models/Transaction");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

const typeValues = Object.values(TRANSACTION_TYPES);
const categoryValues = Object.values(CATEGORIES);

// GET /transactions — viewers, analysts, admins can all read
router.get(
  "/",
  [
    query("type").optional().isIn(typeValues).withMessage(`Type must be one of: ${typeValues.join(", ")}`),
    query("category").optional().isIn(categoryValues).withMessage(`Category must be one of: ${categoryValues.join(", ")}`),
    query("startDate").optional().isISO8601().withMessage("startDate must be a valid date (ISO 8601)"),
    query("endDate").optional().isISO8601().withMessage("endDate must be a valid date (ISO 8601)"),
    query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  ],
  validate,
  getTransactions
);

router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid transaction ID")],
  validate,
  getTransactionById
);

// POST / PATCH / DELETE — analysts and admins only
router.post(
  "/",
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  [
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be a positive number"),
    body("type")
      .isIn(typeValues)
      .withMessage(`Type must be one of: ${typeValues.join(", ")}`),
    body("category")
      .isIn(categoryValues)
      .withMessage(`Category must be one of: ${categoryValues.join(", ")}`),
    body("date")
      .optional()
      .isISO8601()
      .withMessage("Date must be a valid ISO 8601 date"),
    body("notes")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Notes must not exceed 500 characters"),
  ],
  validate,
  createTransaction
);

router.patch(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  [
    param("id").isMongoId().withMessage("Invalid transaction ID"),
    body("amount")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be a positive number"),
    body("type")
      .optional()
      .isIn(typeValues)
      .withMessage(`Type must be one of: ${typeValues.join(", ")}`),
    body("category")
      .optional()
      .isIn(categoryValues)
      .withMessage(`Category must be one of: ${categoryValues.join(", ")}`),
    body("date")
      .optional()
      .isISO8601()
      .withMessage("Date must be a valid ISO 8601 date"),
    body("notes")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Notes must not exceed 500 characters"),
  ],
  validate,
  updateTransaction
);

router.delete(
  "/:id",
  authorize(ROLES.ADMIN),
  [param("id").isMongoId().withMessage("Invalid transaction ID")],
  validate,
  deleteTransaction
);

module.exports = router;
