import {Request, Response} from "express";
import mongoose from "mongoose";
import { Story } from "../model/story";
import { resizeImageIfNeeded } from "../utils/resizeImage";
import { User } from "../model/user";
import fs from "fs/promises";
import cloudinary from "../config/cloudinary";

export const uploadStory = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    try{
        if(!req.file){
            return res.status(400).json({
                msg: "No image uploaded"
            })
        }

        const mediaType = req.file.mimetype.startsWith('video/')? 'video': 'image';
        
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/jpg',
            'image/webp',
            'video/mp4',
            'video/webm',
        ]
        if(!allowedTypes.includes(req.file.mimetype)){
            await fs.unlink(req.file.path);
            return res.status(400).json({ 
                msg: "unsupported media format"
            });
        }
        const {uploadPath, tempFilesToDelete} = await resizeImageIfNeeded(
            req.file.path,
            req.file.originalname,
            req.file.size
        )
        const result = await cloudinary.uploader.upload(uploadPath, {
            folder: "stories",
            resource_type: mediaType,
        })

        for(const filePath of ([req.file.path, ...tempFilesToDelete])){
            try{
                await fs.unlink(filePath);
                console.log(`deleted file: ${filePath}`);
            }catch(err){
                console.error("unable to delete the file: ", filePath, err)
            }
        }

        const newStory = await Story.create({
            user: userId,
            mediaUrl: (await result).secure_url,
            mediaType,
            caption: req.body.caption,
            expiresAt: new Date(Date.now() + 24*60*60*1000),
            viewers: []
        })

        await User.findByIdAndUpdate(userId,{
            $push: {
                stories: newStory
            }
        })

        await newStory.populate('user', 'username profileImage')
        res.json({
            msg: "story uploaded",
            newStory
        })

    }catch(err){
        return res.status(500).json({
            msg: "server error",
            err
        })
    }

}

export const deleteStory = async(req: Request, res: Response) => {
    const userId = (req as any).userId;
    const storyId = req.params.id;

    try{
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                msg: "user not found"
            })
        }
        const storyOwned = user.stories.some(
            (id) => id.toString() === storyId
        );

        if(!storyOwned){
            return res.status(403).json({
                msg: "unathorized to delete the story"
            })
        }

        await Story.findByIdAndDelete(storyId);

        await User.findByIdAndUpdate(userId, {
            $pull: {
                stories: storyId
            }
        })

        return res.json({
            msg: "successfully deleted the story"
        })
    }catch(err){
        return res.status(500).json({
            msg: "server error",
            err
        })
    }
}

export const viewStory = async(req: Request, res: Response) => {
    const userId = (req as any).userId;
    const storyId = req.params.id;
    try{
        const story = await Story.findById(storyId).populate('user', 'username profileImage');
        if(!story){
            return res.status(404).json({
                msg: "story not found"
            })
        }
        await 
        await Story.findByIdAndUpdate(storyId, {
            $addToSet: {
                viewers: userId
            }
        }, {new: true})

        const storyObject = story.toObject();

        if (story.user._id.toString() !== userId.toString()) {
            (storyObject as any).viewers = undefined;
        }
        
        return res.json({
            story: storyObject
        })
        
    }catch(err){
        return res.status(500).json({
            msg: "server error",
            err
        })
    }
}