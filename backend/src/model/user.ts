import mongoose from "mongoose";

interface UserProps {
    username: string;
    email: string;
    fullname: string;
    bio?: string;
    password: string;
    profileImage?: string;
    followers: mongoose.Types.ObjectId[];
    following: mongoose.Types.ObjectId[];
    posts: mongoose.Types.ObjectId[];
    savedPosts: mongoose.Types.ObjectId[];
    stories: mongoose.Types.ObjectId[];
    createAt: Date
}

const userSchema: mongoose.Schema<UserProps> = new mongoose.Schema({

    username: {
        type: String,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
    },
    fullname:{
        type: String,
    },
    bio: {
        type: String,
        maxlength: 150,
        default: ""
    },
    password: {
        type: String,
        minlength: 6
    },
    profileImage: {
        type: String,
        default:""
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }],
    savedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }],
    stories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story"
    }]
},  { timestamps: true })

export const User = mongoose.model("User", userSchema);