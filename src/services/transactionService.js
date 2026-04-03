const { Transaction } = require("../models/Transaction");

/**
 * Build a MongoDB filter object from query params.
 */
const buildFilter = ({ type, category, startDate, endDate }) => {
  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  return filter;
};

/**
 * Create a new transaction.
 */
const createTransaction = async (data, userId) => {
  return Transaction.create({ ...data, createdBy: userId });
};

/**
 * Get a paginated, filtered list of transactions.
 */
const getTransactions = async (queryParams) => {
  const {
    type,
    category,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sort = "-date",
  } = queryParams;

  const filter = buildFilter({ type, category, startDate, endDate });

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limitNum),
    Transaction.countDocuments(filter),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Get a single transaction by ID.
 */
const getTransactionById = async (id) => {
  const transaction = await Transaction.findById(id).populate(
    "createdBy",
    "name email"
  );
  if (!transaction) {
    const err = new Error("Transaction not found.");
    err.statusCode = 404;
    throw err;
  }
  return transaction;
};

/**
 * Update a transaction.
 */
const updateTransaction = async (id, updates) => {
  const allowed = ["amount", "type", "category", "date", "notes"];
  const filtered = {};
  allowed.forEach((key) => {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  });

  const transaction = await Transaction.findByIdAndUpdate(id, filtered, {
    new: true,
    runValidators: true,
  });

  if (!transaction) {
    const err = new Error("Transaction not found.");
    err.statusCode = 404;
    throw err;
  }
  return transaction;
};

/**
 * Soft-delete a transaction.
 */
const deleteTransaction = async (id) => {
  const transaction = await Transaction.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  if (!transaction) {
    const err = new Error("Transaction not found.");
    err.statusCode = 404;
    throw err;
  }
  return transaction;
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
