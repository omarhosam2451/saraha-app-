import { z } from "zod"
import { MessageType } from "../../../uitilties/enums.js"

export const createMessageSchema = z.object({
    receiverId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid recipient ID"),
    content: z.string().trim().min(3).max(50000).optional(),
    attachments: z.array(z.string().trim().min(1).max(2048)).max(5).optional(),
}).strict().refine(
    ({ content, attachments }) => Boolean(content) || Boolean(attachments?.length),
    { message: "Message content or at least one attachment is required" }
)

export const messageIdParamSchema = z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid message ID"),
})

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const messagesQuerySchema = z.object({
    type: z.enum(Object.values(MessageType)).default(MessageType.ALL),
    senderId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid sender ID").optional(),
    receiverId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid receiver ID").optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(5),
})
