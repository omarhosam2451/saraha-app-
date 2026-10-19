import envConfig from "./env.config.js"

const {email} = envConfig
export const emailConfig = {
    service:"gmail",
      auth: {
    user: email.user,
    pass: email.password,
}}