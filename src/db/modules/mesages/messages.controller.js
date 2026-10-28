import { Router } from "express"
import * as messageService from "./messages.service.js"
import { authanticate, optionalAuth } from "../../../middlewere/auth.middlewere.js"
import { validation } from "../../../middlewere/validation.middlewere.js"
import {
    messageIdParamSchema,
    messagesQuerySchema,
} from "./message.validation.js"
import { fileType, multerLocal } from "../../../middlewere/multer.local.js"

const messageController = Router()

messageController.post(
    "/",
    optionalAuth,
    multerLocal({ fileType: fileType.images }).array("image"),
    async (req, res, next) => {
        try {
            let data = await messageService.sendMessage(req.body, req.files, req.user || req.authUser)
            return res.status(201).json({ message: "Message created successfully", data })
        } catch (error) {
            next(error)
        }
    }
)

messageController.get(
    "/",
    authanticate,
    validation(messagesQuerySchema, "query"),
    async (req, res, next) => {
        try {
            const data = await messageService.getAllMessages({
                ...req.validate,
                currentUserId: req.authUser._id,
            })
            return res.status(200).json({ message: "Messages fetched successfully", data })
        } catch (error) {
            next(error)
        }
    }
)

messageController.delete(
    "/:id",
    authanticate,
    validation(messageIdParamSchema, "params"),
    async (req, res, next) => {
        try {
            await messageService.deleteReceivedMessage(req.validate.id, req.authUser._id)
            return res.status(200).json({ message: "Message deleted successfully" })
        } catch (error) {
            next(error)
        }
    }
)

export default messageController
