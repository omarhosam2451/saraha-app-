import dotenv from "dotenv"
dotenv.config({path:[`.${process.env.NODE_ENV}.env`, ".env"]})

const envConfig = {
    dataBase:{
    uri:process.env.DB_URI_LOCAL,
},
encryption:{
key: process.env.ENCRYPTION_KEY,
iV:parseInt(process.env.IV_LENGTH)
},user:{
    jwtSecret:process.env.JWT_TOKEN_SECRET
}
}
export default envConfig