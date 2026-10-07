import {mongoose} from "mongoose";
import envConfig from "../config/env.config.js";
export const dbconnection = async () => {
    try {
        await mongoose.connect(envConfig.dataBase.uri);

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("MongoDB connection error:", error.message);
    }
};

export default dbconnection;