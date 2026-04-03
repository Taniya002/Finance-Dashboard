const jwt = require("jsonwebtoken");
const { User } = require("../models/User");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Register a new user.
 */
const register = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error("Email already registered.");
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, email, password, role });
  const token = signToken(user._id);
  return { user, token };
};

/**
 * Log in with email + password.
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error("Your account has been deactivated.");
    err.statusCode = 403;
    throw err;
  }

  const token = signToken(user._id);
  return { user, token };
};

module.exports = { register, login };
