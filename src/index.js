    import "./config/env.config.js"
    import express from 'express'
    import authController from './db/modules/auth/auth.controller.js'
    import userController from './db/modules/user/user.controller.js'
    import messageController from './db/modules/mesages/messages.controller.js'
    import dbconnection from "./db/db.connection.js"
    import globalErrorHandelingMiddlerwhere from "./middlewere/global-error-handeling-middlerwhere.js"
    import { connectRedis } from "./common/redis.clients.js"
    import cors from "cors"
  import { transporter } from "./common/clients/emailClient.js"
  dbconnection()
    connectRedis()
    const app = express()
    const port = process.env.PORT

    app.use(cors() ,express.json())

    app.get('/', (req, res) => res.send('Hello World!'))
    app.use('/api/auth', authController)
    app.use('/api/user', userController)
    app.use('/api/messages', messageController)
    app.use(globalErrorHandelingMiddlerwhere)
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))

    try {
  await transporter.verify();
  console.log("Server is ready to take our messages");
} catch (err) {
  console.error("Email transporter verification failed:", err);
}
