import mongoose from "mongoose";

interface notificationPorps{
    recipient: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    type: "likes" | "comments" | "message" | "follow" | "other";
    read: boolean;
}

const notificationSchema: mongoose.Schema<notificationPorps> = new mongoose.Schema({
    recipient:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    type: {
        type: String,
        enum: ["likes", "comments", "message", "follow", "other"],
    },
    read:{
        type: Boolean,
        default: false
    },
},{timestamps: true})

export const Notification = mongoose.model("Notification", notificationSchema);
