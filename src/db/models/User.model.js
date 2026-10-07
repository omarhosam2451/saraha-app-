import mongoose from "mongoose"

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
    gender:{
        type:String , enum:["male","female"],
        default:"male"
    },
    age:{type:Number, min:18, max:100},
    profileImage:{type:String},

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