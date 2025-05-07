import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/crypto-crash");
    console.log("MongoDB connected");
  } catch (error) {
    console.log("MongoDB error", error);
    process.exit(1);
  }
};
export default connectDB;
