const mongoose = require("mongoose");

// Use in-memory URI for tests (set via env or default)
const TEST_URI =
  process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/finance_test";

const connectTestDB = async () => {
  await mongoose.connect(TEST_URI);
};

const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

const clearCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

module.exports = { connectTestDB, disconnectTestDB, clearCollections };
