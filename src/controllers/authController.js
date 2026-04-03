const authService = require("../services/authService");
const { sendSuccess } = require("../utils/response");

const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    sendSuccess(res, 201, "Registration successful.", { user, token });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    sendSuccess(res, 200, "Login successful.", { user, token });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  sendSuccess(res, 200, "Current user fetched.", { user: req.user });
};

module.exports = { register, login, getMe };
