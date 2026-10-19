import mongoose from "mongoose";
import { dbConfig } from "./../config/db.config.js";

export const dbconnection = async () => {
    try {
        await mongoose.connect(dbConfig);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("MongoDB connection error:", error.message);
    }
};

export default dbconnection;