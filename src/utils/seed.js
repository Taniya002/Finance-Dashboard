require("dotenv").config();
const mongoose = require("mongoose");
const { User, ROLES } = require("../models/User");
const { Transaction, TRANSACTION_TYPES, CATEGORIES } = require("../models/Transaction");

const connectDB = require("../config/db");

const USERS = [
  { name: "Alice Admin", email: "admin@demo.com", password: "password123", role: ROLES.ADMIN },
  { name: "Ananya Analyst", email: "analyst@demo.com", password: "password123", role: ROLES.ANALYST },
  { name: "Victor Viewer", email: "viewer@demo.com", password: "password123", role: ROLES.VIEWER },
];

const randomBetween = (min, max) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(2));

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomDate = (daysBack) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d;
};

const seed = async () => {
  await connectDB();
  console.log("Seeding database...");

  await User.deleteMany({});
  await Transaction.deleteMany({});

  // Create users
  const users = await User.insertMany(USERS.map((u) => ({ ...u })));
  // Manually hash passwords since insertMany skips pre-save hooks
  // Instead, create one by one:
  await User.deleteMany({});
  const createdUsers = [];
  for (const u of USERS) {
    createdUsers.push(await User.create(u));
  }

  const adminUser = createdUsers[0];

  // Create 60 transactions spread across 6 months
  const incomeCategories = [CATEGORIES.SALARY, CATEGORIES.FREELANCE, CATEGORIES.INVESTMENT];
  const expenseCategories = [
    CATEGORIES.FOOD, CATEGORIES.TRANSPORT, CATEGORIES.UTILITIES,
    CATEGORIES.ENTERTAINMENT, CATEGORIES.HEALTHCARE, CATEGORIES.RENT,
  ];

  const transactions = [];
  for (let i = 0; i < 60; i++) {
    const isIncome = Math.random() > 0.45;
    transactions.push({
      amount: isIncome ? randomBetween(500, 8000) : randomBetween(50, 2000),
      type: isIncome ? TRANSACTION_TYPES.INCOME : TRANSACTION_TYPES.EXPENSE,
      category: isIncome ? randomItem(incomeCategories) : randomItem(expenseCategories),
      date: randomDate(180),
      notes: `Seeded transaction #${i + 1}`,
      createdBy: adminUser._id,
    });
  }

  await Transaction.insertMany(transactions);

  console.log(`✅ Seeded ${createdUsers.length} users and ${transactions.length} transactions.`);
  console.log("\nDemo credentials:");
  USERS.forEach((u) => console.log(`  ${u.role}: ${u.email} / ${u.password}`));

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
