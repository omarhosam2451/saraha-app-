import Message from "../models/message.model.js";
import BaseRepository from "./baseRepo.js";

export default class MessageRepository extends BaseRepository {
    constructor() {
        super(Message)
    }

    createMessage(data) {
        const payload = data?.data || data
        return this.createNewDocument(payload)
    }

    findMessages(where, { skip, limit }) {
        return this.model
            .find(where)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
    }

    countMessages(where) {
        return this.model.countDocuments(where)
    }

    deleteMessage(where) {
        return this.model.deleteOne(where)
    }
}