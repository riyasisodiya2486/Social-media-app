import { Request, Response } from "express";
import { User } from "../model/user";
import { userProfile } from "../utils/types";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary";
import { resizeImageIfNeeded } from "../utils/resizeImage";
import fs from "fs";

export const createUserProfile = async (req: Request, res: Response) =>{
    const parsePayload = userProfile.safeParse(req.body);
    if(!parsePayload.success){
        return res.status(403).json({
            msg: "invalid inputs"
        })
    }

    try{
        let profileImageUrl = parsePayload.data.profileImage || '';

        if(req.file){
            const {uploadPath , tempFilesToDelete} = await resizeImageIfNeeded(
                req.file.path,
                req.file.originalname,
                req.file.size
            );

            const result = await cloudinary.uploader.upload(uploadPath, {
                folder: 'profileImages',
            });

            profileImageUrl = result.secure_url;

            for(const filePath of ([req.file.path, ...tempFilesToDelete])){
                try{
                    if(fs.existsSync(filePath)){
                        fs.unlinkSync(filePath);
                    }
                }catch(err){
                    console.log("failed to delete file: ", filePath, err);
                }
            }
        }

        const updateUser = await User.findByIdAndUpdate((req as any).userId ,
        {
            bio: parsePayload.data.bio,
            fullname: parsePayload.data.fullname,
            profileImage: profileImageUrl
            
        }, {new: true})
        
        if (!updateUser) {
            return res.status(404).json({ 
                msg: "User not found",
            });
        }
        
        res.json({
            msg: "successfully updated the profile",
            user: updateUser
        })
    }
    catch (err) {
        res.status(500).json({ 
            msg: "Server error", error: err 
        });
    }
}

export const getUser = async (req: Request, res: Response) => {
    try{
        const getUser = await User.findById(req.params.id);
        if(!getUser){
            return res.status(403).json({
                msg: "user not found"
            })
        }
        return res.json({
            getUser
        })

    }catch(err){
        res.status(500).json({
            msg: "Server error",
            error: err
        })
    }
}

export const followUser = async (req: Request, res: Response) => {
    const currentUserId = (req as any).userId;
    const targetUserId = req.params.id;

    if(currentUserId === targetUserId){
        return res.status(400).json({
            msg: "you can't follow yourself"   
        })
    }

    try{
        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if(!targetUser || !currentUser){
            return res.status(400).json({
                msg: "user not found"
            });
        }

        if(currentUser.following.includes(new mongoose.Types.ObjectId(targetUserId))){
            return res.status(400).json({
                msg: "already following this user"
            })
        }

        currentUser.following.push(new mongoose.Types.ObjectId(targetUserId));
        targetUser.followers.push(new mongoose.Types.ObjectId(currentUserId));

        await currentUser.save();
        await targetUser.save();

        res.json({
            msg: "followed successfully"
        });

    }catch(err){
        res.status(500).json({
            msg: "server error",
            error: err
        })
    }
}

export const unfollowUser = async (req: Request, res: Response) => {
    const currentUserId = (req as any).userId;
    const targetUserId = req.params.id;
    try{
        await User.findByIdAndUpdate(currentUserId, {
            $pull: {
                following: targetUserId
            }
        })
        await User.findByIdAndUpdate(targetUserId, {
            $pull: {
                followers: currentUserId
            }
        })
        res.json({
            msg: "unfollowed successfully"
        })

    }catch(err){
        return res.json({
            msg: "server error",
            error: err
        })
    }
}

export const getUserProfile = async (req: Request, res: Response) => {
    try{
        const user = await User.findById(req.params.id)
            .populate("followers", "fullname profileImage")
            .populate("following", "fullname profileImage");

        if(!user){
            return res.status(404).json({
                msg: "User not found"
            });
        }

        res.json({
            user,
            followerCount : user.followers.length,
            followingCount: user.following.length
        });
    }catch(err){
        res.status(500).json({
            msg: "Server error",
            error: err
        })
    }
}
