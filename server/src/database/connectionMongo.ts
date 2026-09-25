import mongoose from "mongoose";
import { env } from "../config/env.service";

export const connectDB = async () => {
  try {
    await mongoose.connect(env.databaseUrl as string);

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);

    throw error;
  }
};
