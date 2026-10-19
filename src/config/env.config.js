import dotenv from "dotenv"
dotenv.config({path:[`.${process.env.NODE_ENV}.env`, ".env"]})

export const userEnvConfig = {
    access_token_secret: process.env.JWT_TOKEN_SECRET,
    access_token_expires_in: process.env.ACCESS_TOKEN_EXPIRY || "1h",
    refresh_token_secret: process.env.JWT_TOKEN_REFRESH_SECRET || (process.env.JWT_TOKEN_SECRET + "_refresh"),
    refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRY || "7d",
};

const envConfig = {
    userEnvConfig,
    dataBase:{
        uri:process.env.DB_URI_LOCAL,
    },
    encryption:{
        key: process.env.ENCRYPTION_KEY,
        iV:parseInt(process.env.IV_LENGTH)
    },
    user:{
        jwtSecret:process.env.JWT_TOKEN_SECRET,
        jwtRefreshSecret:process.env.JWT_TOKEN_REFRESH_SECRET || (process.env.JWT_TOKEN_SECRET + "_refresh"),
    },
    admin:{
        jwtSecret: process.env.JWT_ADMIN_SECRET || (process.env.JWT_TOKEN_SECRET + "_admin"),
        jwtRefreshSecret: process.env.JWT_ADMIN_REFRESH_SECRET || (process.env.JWT_ADMIN_SECRET + "_refresh"),
    },
    tokenExpiry:{
        access: process.env.ACCESS_TOKEN_EXPIRY || "1h",
        refresh: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    },GCP:{
        clientId: process.env.GCP_CLIENT_ID,
    },redis:{
        url: process.env.REDUS_CLOUD_URL
    },email:{
        user: process.env.USER_EMAIL,
        password: process.env.EMAIL_PASSWORD
    }   
}
export default envConfig