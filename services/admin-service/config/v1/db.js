import "dotenv/config";
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Admin service MongoDB connected.");
  } catch (error) {
    console.error("Error connecting MongoDB:", error);
  }
};

export default connectDB;
