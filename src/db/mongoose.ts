import mongoose from "mongoose";

import { getEnv } from "@/config/env";

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseConnection?: Promise<typeof mongoose>;
};

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const env = getEnv();
  const isTest = env.NODE_ENV === "test";

  // During unit tests, avoid connecting to remote MongoDB Atlas unless explicitly overridden
  const uri =
    isTest && env.MONGODB_URI.startsWith("mongodb+srv://")
      ? "mongodb://127.0.0.1:27017/church-attendance-test"
      : env.MONGODB_URI;

  try {
    globalForMongoose.mongooseConnection ??= mongoose.connect(uri, {
      serverSelectionTimeoutMS: isTest ? 300 : 30000,
      family: 4,
    });
    await globalForMongoose.mongooseConnection;
    return mongoose;
  } catch (error) {
    globalForMongoose.mongooseConnection = undefined;
    throw error;
  }
}
