import mongoose from "mongoose"

const { Schema } = mongoose

const messageSchema = new Schema({

    content:{type:String,
required:function(){return !this.attachments?.length}
        ,minlength:[3,"the message have to be more than 3 charcters "]
        , maxlength:[50000,"the name have to be at most 50000 characters"],
    lowercase:true, trim:true,

},

attachments:[String],
senderId:{type:mongoose.Types.ObjectId ,ref:"User",},
receiverId:{type:mongoose.Types.ObjectId ,ref:"User",required:true}

}
,{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
    ,timestamps:true
})

const message = mongoose.model("message", messageSchema)

export default message