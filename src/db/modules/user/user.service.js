import mongoose from "mongoose"
import User from "../../models/User.model.js"
import jwt from "jsonwebtoken"
import HttpAppError from "../../../uitilties/error/app-error.js"
import envConfig from "../../../config/env.config.js"

export const getUserById = async () => {
const user = req.authUser
	if (!mongoose.Types.ObjectId.isValid(decodedData._id)) {
		throw new HttpAppError("Invalid authorization token", 401, {}, "UNAUTHORIZED")
	}

	if (!user) {
		const error = new Error("User not found")
		error.statusCode = 404
		throw error	
	}



	return user
}

export const getAllUsers = async () => {
	return User.find().select("-password")
}

export const updateProfile = async (userId, data) => {

	const { firstName, lastName, email, gender, age } = data

	return await User.findByIdAndUpdate(
		userId,
		{ firstName, lastName, email, gender, age },
		{
			new: true,
			runValidators: true
		}
	)
}

export const deleteById = async (userId) => {
	return await User.findByIdAndDelete(userId)

}
