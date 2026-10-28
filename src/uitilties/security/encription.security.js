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

export const decrypt = (cipherData) => {
    const [ivHex, cipherText] = cipherData.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let plainText = decipher.update(cipherText, "hex", "utf8");
    plainText += decipher.final("utf8");
    return plainText;
}