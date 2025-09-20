import mongoose from "mongoose";

interface postPorps{
    user: mongoose.Types.ObjectId;
    image: string;
    caption: string;
    comments: mongoose.Types.ObjectId[],
    likes: mongoose.Types.ObjectId[]
}

const postSchema: mongoose.Schema<postPorps> = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    image:{
        type: String,
        required: true
    },
    caption:{
        type: String,
        maxlength: 120
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, {timestamps: true})

export const Post = mongoose.model("Post", postSchema);