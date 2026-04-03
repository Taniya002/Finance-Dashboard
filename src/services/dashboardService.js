const { Transaction, TRANSACTION_TYPES } = require("../models/Transaction");

/**
 * Returns total income, total expenses, and net balance.
 */
const getSummary = async ({ startDate, endDate } = {}) => {
  const dateFilter = buildDateFilter(startDate, endDate);

  const result = await Transaction.aggregate([
    { $match: { isDeleted: false, ...dateFilter } },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const income = result.find((r) => r._id === TRANSACTION_TYPES.INCOME) || {
    total: 0,
    count: 0,
  };
  const expense = result.find((r) => r._id === TRANSACTION_TYPES.EXPENSE) || {
    total: 0,
    count: 0,
  };

  return {
    totalIncome: income.total,
    totalExpenses: expense.total,
    netBalance: income.total - expense.total,
    totalTransactions: income.count + expense.count,
  };
};

/**
 * Returns totals grouped by category.
 */
const getCategoryBreakdown = async ({ startDate, endDate } = {}) => {
  const dateFilter = buildDateFilter(startDate, endDate);

  return Transaction.aggregate([
    { $match: { isDeleted: false, ...dateFilter } },
    {
      $group: {
        _id: { category: "$category", type: "$type" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.category",
        breakdown: {
          $push: {
            type: "$_id.type",
            total: "$total",
            count: "$count",
          },
        },
        categoryTotal: { $sum: "$total" },
      },
    },
    { $sort: { categoryTotal: -1 } },
  ]);
};

/**
 * Returns the N most recent transactions.
 */
const getRecentActivity = async (limit = 10) => {
  return Transaction.find()
    .populate("createdBy", "name email")
    .sort({ date: -1 })
    .limit(parseInt(limit));
};

/**
 * Returns income vs expense totals grouped by month.
 */
const getMonthlyTrends = async ({ year } = {}) => {
  const targetYear = parseInt(year) || new Date().getFullYear();

  const startOfYear = new Date(`${targetYear}-01-01`);
  const endOfYear = new Date(`${targetYear}-12-31T23:59:59`);

  return Transaction.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: startOfYear, $lte: endOfYear },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.month",
        data: {
          $push: { type: "$_id.type", total: "$total", count: "$count" },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        month: "$_id",
        _id: 0,
        data: 1,
      },
    },
  ]);
};

/**
 * Returns income vs expense totals grouped by week for a given month.
 */
const getWeeklyTrends = async ({ year, month } = {}) => {
  const targetYear = parseInt(year) || new Date().getFullYear();
  const targetMonth = parseInt(month) || new Date().getMonth() + 1;

  const start = new Date(`${targetYear}-${String(targetMonth).padStart(2, "0")}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  return Transaction.aggregate([
    { $match: { isDeleted: false, date: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: {
          week: { $week: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.week",
        data: {
          $push: { type: "$_id.type", total: "$total", count: "$count" },
        },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { week: "$_id", _id: 0, data: 1 } },
  ]);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildDateFilter = (startDate, endDate) => {
  if (!startDate && !endDate) return {};
  const filter = { date: {} };
  if (startDate) filter.date.$gte = new Date(startDate);
  if (endDate) filter.date.$lte = new Date(endDate);
  return filter;
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getRecentActivity,
  getMonthlyTrends,
  getWeeklyTrends,
};
