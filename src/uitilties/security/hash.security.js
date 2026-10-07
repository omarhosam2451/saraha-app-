import * as argon2 from "argon2"

export const hash = async (plainText) => {
    return await argon2.hash(plainText)
}

export const compareTwoHashes = async (hash, plainText) => {
    if (typeof hash !== "string" || !hash.startsWith("$argon2")) {
        return false
    }
    return await argon2.verify(hash, plainText)
}