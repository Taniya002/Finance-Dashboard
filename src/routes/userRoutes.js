const express = require("express");
const { body, param } = require("express-validator");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { ROLES } = require("../models/User");

const router = express.Router();

// All user management routes require authentication + admin role
router.use(authenticate, authorize(ROLES.ADMIN));

router.get("/", getAllUsers);

router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid user ID")],
  validate,
  getUserById
);

router.patch(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid user ID"),
    body("role")
      .optional()
      .isIn(Object.values(ROLES))
      .withMessage(`Role must be one of: ${Object.values(ROLES).join(", ")}`),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
  ],
  validate,
  updateUser
);

router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid user ID")],
  validate,
  deleteUser
);

module.exports = router;
