import { Router } from "express"

const messageController = Router()

messageController.get('/', (req, res) => {
    res.status(200).json({message: 'Hello from message controller!'})
})

export default messageController