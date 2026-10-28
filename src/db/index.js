import UserRepository from "./repositories/user.repository.js"
import MessageRepository from "./repositories/message.repository.js"

export const userRepo = new UserRepository()
export const messageRepo = new MessageRepository()

export { UserRepository, MessageRepository }
