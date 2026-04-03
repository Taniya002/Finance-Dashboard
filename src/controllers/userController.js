const userService = require("../services/userService");
const { sendSuccess } = require("../utils/response");

const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    sendSuccess(res, 200, "Users fetched.", { users });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    sendSuccess(res, 200, "User fetched.", { user });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    sendSuccess(res, 200, "User updated.", { user });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user._id);
    sendSuccess(res, 200, "User deleted.");
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
