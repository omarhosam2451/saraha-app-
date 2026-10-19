import { Router } from "express"
import * as userService from "./user.service.js"
import { authanticate, authorize } from "../../../middlewere/auth.middlewere.js"
import { validation } from "../../../middlewere/validation.middlewere.js"
import {
    updateProfileSchema,
    adminUpdateUserSchema,
    userIdParamSchema,
} from "./user.validation.js"

const userController = Router()

userController.get("/", (req, res) => {
    res.status(200).json({ message: "Hello from user controller!" })
})

userController.get("/getUser", authanticate, async (req, res, next) => {
    try {
        const profile = await userService.getMyProfile(req.authUser)
        res.status(200).json({ message: "Profile fetched successfully", user: profile })
    } catch (err) {
        next(err)
    }
}
)

userController.patch("/updateUser", authanticate, validation(updateProfileSchema, "body"), async (req, res, next) => {
    try {
        const updated = await userService.updateMyProfile(req.authUser._id, req.validate)
        res.status(200).json({ message: "Profile updated successfully", user: updated })
    } catch (err) {
        next(err)
    }
}
)

userController.delete("/deleteMyAccount", authanticate, async (req, res, next) => {
    try {
        const result = await userService.deleteAccount(req.authUser._id)
        res.status(200).json({ message: "Account deactivated successfully", user: result })
    } catch (err) {
        next(err)
    }
}
)

userController.get("/getAll", authanticate, authorize(["admin"]),
    async (req, res, next) => {
        try {
            const users = await userService.getAllUsers()
            res.status(200).json({ message: "Users fetched successfully", users })
        } catch (err) {
            next(err)
        }
    }
)

userController.get("/getUser/Id", authanticate, authorize(["admin"]), validation(userIdParamSchema, "params"),
    async (req, res, next) => {
        try {
            const user = await userService.getUserById(req.validate.id)
            res.status(200).json({ message: "User fetched successfully", user })
        } catch (err) {
            next(err)
        }
    }
)

userController.patch("/admin/:id", authanticate, authorize(["admin"]), validation(userIdParamSchema, "params"),
    validation(adminUpdateUserSchema, "body"),
    async (req, res, next) => {
        try {
            const { id, ...bodyData } = req.validate
            const updated = await userService.adminUpdateUser(id, bodyData)
            res.status(200).json({ message: "User updated successfully", user: updated })
        } catch (err) {
            next(err)
        }
    }
)

userController.delete("/deleteUser/:id", authanticate, authorize(["admin"]), validation(userIdParamSchema, "params"), async (req, res, next) => {
    try {
        const deleted = await userService.deleteById(req.validate.id)
        res.status(200).json({ message: "User deleted successfully", user: deleted })
    } catch (err) {
        next(err)
    }
}
)

export default userController