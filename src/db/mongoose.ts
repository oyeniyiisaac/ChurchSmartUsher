import mongoose from "mongoose";

import { getEnv } from "@/config/env";

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseConnection?: Promise<typeof mongoose>;
};

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    globalForMongoose.mongooseConnection ??= mongoose.connect(getEnv().MONGODB_URI, {
      serverSelectionTimeoutMS: 300,
    });
    await globalForMongoose.mongooseConnection;
    return mongoose;
  } catch (error) {
    globalForMongoose.mongooseConnection = undefined;
    throw error;
  }
}
