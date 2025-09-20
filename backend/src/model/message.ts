import mongoose from "mongoose";
import { boolean } from "zod";

interface messageProps{
    recipent: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    message: string;
    read: boolean;
}

const messageSchema: mongoose.Schema<messageProps> = new mongoose.Schema({
    recipent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    message: {
        type: String
    },
    read: {
        type: Boolean,
        default: false
    }
}, {timestamps: true}) 

export const Message = mongoose.model("Message", messageSchema);