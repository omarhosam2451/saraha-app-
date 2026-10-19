import mongoose from "mongoose"
import { Gender, providersEnum, Role } from "../../uitilties/enums.js"

const { Schema } = mongoose

const userSchema = new Schema({
    firstName:{type:String, required:true
        ,minlength:[3,"first name have to be at least 3 characters"]
        , maxlength:[20,"first name have to be at most 20 characters"],
    lowercase:true, trim:true,},
    lastName:{type:String, required:true
        ,minlength:[3,"last name have to be at least 3 characters"]
        , maxlength:[20,"last name have to be at most 20 characters"],
        trim:true, uppercase:true},
    email:{type:String, required:true},
    emailLookupHash:{type:String, unique:true, sparse:true, select:false},
    password: {
        type: String,
        required: true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    }
    , 
    gender:{
        type:String , enum: Object.values(Gender),
        default: Gender.MALE
    },
    age:{type:Number, min:18, max:100},
    profileImage:{type:String},
    role: {
        type: String,
        enum: Object.values(Role),
        default: Role.USER,
    },
    googleSub: {
        type: String,
        index: {
            name: "google_sub_unique",
            unique: true,
            sparse: true,
        },
    },
    provider: {
        type: String,
        enum: Object.values(providersEnum),
        default: providersEnum.SYSTEM,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },

}
,{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
    ,timestamps:true
})

userSchema.virtual("fullName").get(function () {
    return `${this.firstName}__${this.lastName}`
})

const User = mongoose.model("User", userSchema)

export default User