import mongoose from "mongoose";

interface storyProps{
    user: mongoose.Types.ObjectId;
    mediaUrl: string;
    mediaType: "image" | "video";
    caption?: string;
    viewers: mongoose.Types.ObjectId[];
    expiresAt: Date;
    createdAt: Date;
}

const storySchema: mongoose.Schema<storyProps> = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    mediaUrl: {
        type: String
    },
    mediaType: {
        type: String,
        enum: ["image" , "video"]
    },
    caption: {
        type: String,
        trim: true 
    },
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24*60*60*1000)
    }
}, {timestamps: true})

storySchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

export const Story = mongoose.model("Story", storySchema)