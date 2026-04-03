const transactionService = require("../services/transactionService");
const { sendSuccess } = require("../utils/response");

const createTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction(
      req.body,
      req.user._id
    );
    sendSuccess(res, 201, "Transaction created.", { transaction });
  } catch (err) {
    next(err);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.getTransactions(req.query);
    sendSuccess(res, 200, "Transactions fetched.", result);
  } catch (err) {
    next(err);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(
      req.params.id
    );
    sendSuccess(res, 200, "Transaction fetched.", { transaction });
  } catch (err) {
    next(err);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.updateTransaction(
      req.params.id,
      req.body
    );
    sendSuccess(res, 200, "Transaction updated.", { transaction });
  } catch (err) {
    next(err);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    await transactionService.deleteTransaction(req.params.id);
    sendSuccess(res, 200, "Transaction deleted (soft).");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
