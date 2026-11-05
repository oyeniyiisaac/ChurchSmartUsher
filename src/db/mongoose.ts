import mongoose from "mongoose";

import { getEnv } from "@/config/env";

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseConnection?: Promise<typeof mongoose>;
};

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  globalForMongoose.mongooseConnection ??= mongoose.connect(getEnv().MONGODB_URI);
  await globalForMongoose.mongooseConnection;
  return mongoose;
}
