import User from "../models/User.model.js";
import BaseRepository from "./baseRepo.js";
import HttpAppError from "../../uitilties/error/app-error.js";

export default class UserRepository extends BaseRepository {
    constructor() {
        super(User)
    }

    static findUser(args) {
        return new UserRepository().findUser(args)
    }

    async findUser({ where = {}, check = false, select = "" } = {}) {
        let query = this.model.findOne(where)
        if (select) {
            query = query.select(select)
        }

        const user = await query
        if (!user && check) {
            throw new HttpAppError("User not found", 404, {}, "USER_NOT_FOUND")
        }
        return user
    }

    findUsers({ where = {}, limit, skip = 0 } = {}) {
        let query = this.model.find(where).skip(skip)
        if (limit !== undefined) {
            query = query.limit(limit)
        }
        return query
    }

    createUser({ data }) {
        return this.createNewDocument(data)
    }

    updateUser({ data, where }) {
        return this.findAndUpdateDocument(where, data, {
            new: true,
            runValidators: true,
        })
    }

    findUserByEmailHash(emailLookupHash) {
        return this.findOneDocument({ emailLookupHash })
    }
}