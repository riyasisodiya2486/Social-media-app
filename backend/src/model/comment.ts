import mongoose from "mongoose";

interface commentsProps{
    user: mongoose.Types.ObjectId;
    post:mongoose.Types.ObjectId;
    text: string;
}

const commentsSchema: mongoose.Schema<commentsProps> = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    text: {
        type: String,
        maxlength: 120
    }
}, {timestamps: true});

export const Comment = mongoose.model("Comments", commentsSchema);