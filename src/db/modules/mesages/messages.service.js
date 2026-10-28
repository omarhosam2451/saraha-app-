import mongoose from "mongoose"
import { userRepo as ur, messageRepo as mr } from "../../db/index.js"
import HttpAppError from "../../../uitilties/error/app-error.js"
import { MessageType } from "../../../uitilties/enums.js"

const validateObjectId = (id, label) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new HttpAppError(`Invalid ${label} ID`, 400, {}, "BAD_REQUEST")
    }
}
const messageRepository = mr
const userRepository = ur

import { optionalAuth } from "../../../middlewere/optionalAuth.middleware.js"

export const sendMessage = async (body, files, user) => {
    let data, uploadedFiles, senderId;

    if (Array.isArray(body)) {
        uploadedFiles = body;
        data = files || {};
        senderId = user;
    } else {
        data = body || {};
        uploadedFiles = files;
        senderId = user;
    }

    if (data && data.headers) {
        const req = data;
        if (!req.user && !req.authUser && req.headers.authorization) {
            await optionalAuth(req, {}, () => {});
        }
        data = { ...req.body };
        uploadedFiles = uploadedFiles || req.files;
        senderId = senderId || req.user || req.authUser;
    }

    const receiverId = (data.receiverId || data.recipientId)?.toString().trim();
    validateObjectId(receiverId, "receiver");

    const userSenderId = senderId?._id || (typeof senderId === "string" ? senderId : undefined) || data.senderId?._id || (typeof data.senderId === "string" ? data.senderId : undefined);
    if (userSenderId) {
        data.senderId = userSenderId;
    }

    if (uploadedFiles && uploadedFiles.length > 0) {
        const imagesPaths = [];

        for (const file of uploadedFiles) {
            let filePath = file.path?.includes("uploads")
                ? ("uploads" + file.path.split("uploads")[1])
                : (file.path || file.fullPath);
            imagesPaths.push(filePath);
        }

        data.attachments = imagesPaths;
        data.images = imagesPaths;
    }

    await ur.findUser({
        where: { _id: receiverId },
        select: "_id",
        check: true
    });

    return await mr.createMessage({ data });
};
export const createMessage = sendMessage

export const getAllMessages = async ({
    type = MessageType.ALL,
    senderId,
    receiverId, 
    currentUserId,
    page = 1,
    limit = 5,
}) => {
    page = Number(page) || 1
    limit = Number(limit) || 5
    const skip = (page - 1) * limit

    if (senderId) validateObjectId(senderId, "sender")
    if (receiverId) validateObjectId(receiverId, "receiver")

    const requesterId = currentUserId?.toString()
    if (!requesterId) {
        throw new HttpAppError("Authentication is required", 401, {}, "UNAUTHORIZED")
    }

    const filter = {}
    if (senderId || receiverId) {
        if (requesterId !== senderId && requesterId !== receiverId) {
            throw new HttpAppError("You can only view messages involving your account", 403, {}, "FORBIDDEN")
        }
        if (senderId) filter.senderId = senderId
        if (receiverId) filter.receiverId = receiverId
    } else if (type === MessageType.SENT) {
        filter.senderId = requesterId
    } else if (type === MessageType.RECEIVED) {
        filter.receiverId = requesterId
    } else {
        filter.$or = [
            { senderId: requesterId },
            { receiverId: requesterId },
        ]
    }

    const [messages, total] = await Promise.all([
        messageRepository.findMessages(filter, {
            skip,
            limit,
        }),
        messageRepository.countMessages(filter),
    ])

    return { messages, total, page, limit }
}

export const getInbox = async (receiverId, { page, limit }) => {
    const filter = { receiverId }
    const [messages, total] = await Promise.all([
        messageRepository.findMessages(filter, {
            skip: (page - 1) * limit,
            limit,
        }),
        messageRepository.countMessages(filter),
    ])

    return { messages, total, page, limit }
}

export const getSentMessages = async (senderId, { page, limit }) => {
    const filter = { senderId }
    const [messages, total] = await Promise.all([
        messageRepository.findMessages(filter, {
            skip: (page - 1) * limit,
            limit,
        }),
        messageRepository.countMessages(filter),
    ])

    return { messages, total, page, limit }
}

export const getMessageById = async (messageId, userId) => {
    validateObjectId(messageId, "message")

    const message = await messageRepository.findDocumentById(messageId)
    if (!message || (message.receiverId.toString() !== userId.toString()
        && message.senderId?.toString() !== userId.toString())) {
        throw new HttpAppError("Message not found", 404, {}, "MESSAGE_NOT_FOUND")
    }
    return message
}

export const deleteReceivedMessage = async (messageId, receiverId) => {
    validateObjectId(messageId, "message")

    const result = await messageRepository.deleteMessage({ _id: messageId, receiverId })
    if (result.deletedCount === 0) {
        throw new HttpAppError("Message not found", 404, {}, "MESSAGE_NOT_FOUND")
    }
}
