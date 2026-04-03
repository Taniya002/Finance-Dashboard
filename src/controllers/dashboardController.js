const dashboardService = require("../services/dashboardService");
const { sendSuccess } = require("../utils/response");

const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary(req.query);
    sendSuccess(res, 200, "Summary fetched.", data);
  } catch (err) {
    next(err);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const data = await dashboardService.getCategoryBreakdown(req.query);
    sendSuccess(res, 200, "Category breakdown fetched.", { breakdown: data });
  } catch (err) {
    next(err);
  }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const limit = req.query.limit || 10;
    const data = await dashboardService.getRecentActivity(limit);
    sendSuccess(res, 200, "Recent activity fetched.", { transactions: data });
  } catch (err) {
    next(err);
  }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const data = await dashboardService.getMonthlyTrends(req.query);
    sendSuccess(res, 200, "Monthly trends fetched.", { trends: data });
  } catch (err) {
    next(err);
  }
};

const getWeeklyTrends = async (req, res, next) => {
  try {
    const data = await dashboardService.getWeeklyTrends(req.query);
    sendSuccess(res, 200, "Weekly trends fetched.", { trends: data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getRecentActivity,
  getMonthlyTrends,
  getWeeklyTrends,
};
