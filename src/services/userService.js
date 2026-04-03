const { User } = require("../models/User");

/**
 * Get all users (admin only).
 */
const getAllUsers = async () => {
  return User.find().sort({ createdAt: -1 });
};

/**
 * Get a single user by ID.
 */
const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }
  return user;
};

/**
 * Update a user's role or status (admin only).
 */
const updateUser = async (id, updates) => {
  const allowed = ["role", "isActive", "name"];
  const filtered = {};
  allowed.forEach((key) => {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  });

  const user = await User.findByIdAndUpdate(id, filtered, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }
  return user;
};

/**
 * Delete a user (admin only). Cannot delete yourself.
 */
const deleteUser = async (targetId, requestingUserId) => {
  if (targetId === requestingUserId.toString()) {
    const err = new Error("You cannot delete your own account.");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findByIdAndDelete(targetId);
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }
  return user;
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
