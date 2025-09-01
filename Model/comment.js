import mongoose from "mongoose";

const commentSchema = mongoose.Schema({
    userId:{
        type:Array,
        users:[],
        required:true
    },
    userPostId:{
        type:String,
        required:true,
    },
    comment:{
        type:Array,
        comments:[],
        required:true
    }
})

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
