import crypto from "node:crypto"
import envConfig from "../../config/env.config.js"

let ENCRYPTION_KEY = Buffer.from(envConfig.encryption.key || "", "hex")
if (ENCRYPTION_KEY.length !== 32) {
    ENCRYPTION_KEY = crypto.createHash("sha256").update(String(envConfig.encryption.key || "default_secret_key")).digest()
}

const IV_LENGTH = envConfig.encryption.iV || 16

export const encrypt = (plainText) => {

    const iv = crypto.randomBytes(IV_LENGTH)

    const cipherObject = crypto.createCipheriv(
        "aes-256-cbc",
        ENCRYPTION_KEY,
        iv
    )

    let cipherText = cipherObject.update(
        plainText,
        "utf8",
        "hex"
    )

    cipherText += cipherObject.final("hex")

    return `${iv.toString("hex")}:${cipherText}`
}

export const hashEmail = (email) => {
    return crypto
        .createHmac("sha256", crypto.createHmac("sha256", ENCRYPTION_KEY).update("email-lookup").digest())
        .update(email.trim().toLowerCase())
        .digest("hex")
}