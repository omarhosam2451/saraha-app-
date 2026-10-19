import mongoose from "mongoose"
import User from "../../models/User.model.js"
import HttpAppError from "../../../uitilties/error/app-error.js"

export const getUserById = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new HttpAppError("Invalid user ID", 400, {}, "BAD_REQUEST")
    }

    const user = await User.findById(userId).select("-password")
    if (!user) {
        throw new HttpAppError("User not found", 404, {}, "USER_NOT_FOUND")
    }
    return user
}

export const getMyProfile = async (authUser) => {
    return authUser
}

export const updateMyProfile = async (authUserId, data) => {
    const { firstName, lastName, gender, age, profileImage } = data
    const updated = await User.findByIdAndUpdate(
        authUserId,
        { firstName, lastName, gender, age, profileImage },
        { new: true, runValidators: true }
    ).select("-password")

    if (!updated) {
        throw new HttpAppError("User not found", 404, {}, "USER_NOT_FOUND")
    }
    return updated
}

export const deleteAccount = async (authUserId) => {
    const updated = await User.findByIdAndUpdate(
        authUserId,
        { isActive: false },
        { new: true }
    ).select("-password")

    if (!updated) {
        throw new HttpAppError("User not found", 404, {}, "USER_NOT_FOUND")
    }
    return updated
}

export const getAllUsers = async () => {
    return User.find().select("-password")
}

export const adminUpdateUser = async (userId, data) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new HttpAppError("Invalid user ID", 400, {}, "BAD_REQUEST")
    }

    const updated = await User.findByIdAndUpdate(
        userId,
        data,
        { new: true, runValidators: true }
    ).select("-password")

    if (!updated) {
        throw new HttpAppError("User not found", 404, {}, "USER_NOT_FOUND")
    }
    return updated
}

export const deleteById = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new HttpAppError("Invalid user ID", 400, {}, "BAD_REQUEST")
    }
    const deleted = await User.findByIdAndDelete(userId)
    if (!deleted) {
        throw new HttpAppError("User not found", 404, {}, "USER_NOT_FOUND")
    }
    return deleted
}
