const express = require("express");
const { query } = require("express-validator");
const {
  getSummary,
  getCategoryBreakdown,
  getRecentActivity,
  getMonthlyTrends,
  getWeeklyTrends,
} = require("../controllers/dashboardController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { ROLES } = require("../models/User");

const router = express.Router();

// All dashboard routes: must be logged in, viewer role excluded
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.ANALYST));

const dateRangeValidators = [
  query("startDate").optional().isISO8601().withMessage("startDate must be a valid ISO 8601 date"),
  query("endDate").optional().isISO8601().withMessage("endDate must be a valid ISO 8601 date"),
];

router.get("/summary", dateRangeValidators, validate, getSummary);

router.get("/categories", dateRangeValidators, validate, getCategoryBreakdown);

router.get(
  "/recent",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("limit must be between 1 and 50"),
  ],
  validate,
  getRecentActivity
);

router.get(
  "/trends/monthly",
  [
    query("year")
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage("year must be a valid 4-digit year"),
  ],
  validate,
  getMonthlyTrends
);

router.get(
  "/trends/weekly",
  [
    query("year")
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage("year must be a valid year"),
    query("month")
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage("month must be between 1 and 12"),
  ],
  validate,
  getWeeklyTrends
);

module.exports = router;
