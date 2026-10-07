import { Router } from "express"
import * as userService from "./user.service.js"
import { authanticate } from "../../../middlewere/auth.middlewere.js"

const userController = Router()

userController.get('/', (req, res) => {
    res.status(200).json({message: 'Hello from user controller!'})
})

userController.get('/all', async (req, res) => {
    try {
        const users = await userService.getAllUsers()
        res.status(200).json({ message: 'Users found successfully', users })
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message })
    }
})

userController.get('/getUser', authanticate, async (req, res) => {
    try {
        const user = req.authUser
        res.status(200).json({ message: 'User found successfully', user })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message,
            error: error.code || "INTERNAL_SERVER_ERROR"
        })
    }
})

userController.patch("/updateUser/:id", async (req, res) => {
    try {
        const { firstName, lastName, gender, email } = req.body

        const userId = req.params.id

        const result = await userService.updateProfile(
            userId,
            { firstName, lastName, gender, email }
        )

        res.status(200).json({
            message: "User has been updated",
            data: result
        })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already exists",
                error: "Duplicate key error: email must be unique"
            })
        }
        res.status(error.statusCode || 500).json({
            message: error.message || "Something went wrong",
            error: error.message
        })
    }
})


userController.delete("/deleteById/:id", async(req , res)=>{
    try {
      const userId = req.params.id
      const result = await userService.deleteById(userId)
              if (!result) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        res.status(200).json({
            message: "User has been deleted successfully",
            data: result
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message })
    }
})


export default userController