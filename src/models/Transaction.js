const mongoose = require("mongoose");

const TRANSACTION_TYPES = {
  INCOME: "income",
  EXPENSE: "expense",
};

const CATEGORIES = {
  SALARY: "salary",
  FREELANCE: "freelance",
  INVESTMENT: "investment",
  FOOD: "food",
  TRANSPORT: "transport",
  UTILITIES: "utilities",
  ENTERTAINMENT: "entertainment",
  HEALTHCARE: "healthcare",
  EDUCATION: "education",
  RENT: "rent",
  OTHER: "other",
};

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: [true, "Transaction type is required"],
    },
    category: {
      type: String,
      enum: Object.values(CATEGORIES),
      required: [true, "Category is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes must not exceed 500 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false, // soft delete support
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Always exclude soft-deleted records from queries by default
transactionSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// Indexes for frequent filter operations
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ createdBy: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = { Transaction, TRANSACTION_TYPES, CATEGORIES };
