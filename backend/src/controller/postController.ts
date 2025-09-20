import { Request, Response } from "express";
import mongoose from "mongoose";
import fs from "fs/promises";
import cloudinary from "../config/cloudinary";
import { Post } from "../model/post";
import { Comment } from "../model/comment";
import { User } from "../model/user";
import { resizeImageIfNeeded } from "../utils/resizeImage";
import { postSchema } from "../utils/types";


export const createPost = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { caption } = req.body;
    const parsePayload = postSchema.safeParse(req.body);
    
    if(!parsePayload.success){
        return res.status(400).json({
            msg: "invalid inputs"
        })
    }

    try {
        if (!req.file) {
            return res.status(400).json({ 
                msg: "No image uploaded" 
            });
        }

        const {uploadPath, tempFilesToDelete} = await resizeImageIfNeeded(
                req.file.path, 
                req.file.originalname,
                req.file.size
        );

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(uploadPath, 
            {
                folder: 'posts' 
            })

        for(const filePath of ([req.file.path, ...tempFilesToDelete])){
            try{
                await fs.unlink(filePath);
                console.log(`deleted file: ${filePath}`)   
            }catch(err){
                console.log('failed to delete file: ', filePath, err)
            }
        }

        const newPost = await Post.create({
            user: userId,
            image: result.secure_url,
            caption,
        });

        await User.findByIdAndUpdate(userId, {
            $push: { 
                posts: newPost._id
            }
        });


        await newPost.populate('user', 'username profileImage')
        res.json({
        msg: "Post created",
        newPost: newPost.toObject()
        });

  } catch (err: any) {
    return res.status(500).json({
        msg: "server error",
        error: err.message,
    });

  }
};

export const getUserPosts = async (req: Request, res: Response) =>{
    try{
        const posts = await Post.find({
            user: req.params.userId
        }).populate("user", "fullname profileImage")
        .sort({ createdAt: -1 })

        res.json(posts);

    }catch(err){
        res.status(500).json({ msg: "Server error", err }); 
    }
}

export const getPostById = async (req: Request, res: Response) =>{
    try{
        const postId = req.params.id;
        const post = await Post.findById(postId)
            .populate("user", "fullname profileImage")
            .populate({
                path: "comments",
                populate: {
                    path: "user",
                    select: "fullname profileImage"
                }
            });

        if(!post){
            return res.status(404).json({
                msg: "Post not found"
            })
        }

        res.json(post);
    }catch(err){
        res.status(500).json({ msg: "Server error", err });
    }
}

export const deletePost = async (req: Request, res: Response) =>{
    const postId = req.params.id;
    const userId = (req as any).userId;
    try{
        const post = await Post.findByIdAndDelete(postId);
        if(!post){
            return res.status(404).json({
                msg: "user not found"
            })
        }

        await User.findByIdAndUpdate(userId,
            {
                $pull: {
                    posts: postId
                }
            }
        )
        return res.json({
            msg: "successfully deleted the post"
        })
    }catch(err){
        return res.status(500).json({
            msg: "server error",
            error: err
        })
    }
}

export const likePost = async (req: Request, res: Response) =>{
    try{
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({
                msg: "Post not found"
            })
        }

        const userId = (req as any).userId;
        const alreadyLiked = post.likes.some(
            (id) => id.toString() === userId.toString()
        );

        if(alreadyLiked){
            post.likes = post.likes.filter(
                id => id.toString() !== userId.toString()
            );
        }else{
            post.likes.push(new mongoose.Types.ObjectId(userId));
        }

        await post.save();
        res.json({
            msg: alreadyLiked ? "Post unliked" : "Post liked", post
        })
    }catch(err){
         res.status(500).json({ msg: "Server error", err });
    }
}

export const commentOnPost = async (req: Request, res: Response) =>{
    const {text} = req.body;    
    if (!text || text.trim() === "") {
        return res.status(400).json({ msg: "Comment cannot be empty" });
    }
    try{
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({
                msg: "Post not found"
            })
        }
        const userId = (req as any).userId;
        const comment = await Comment.create({
            user: userId,
            post: req.params.id,
            text
        })
        post.comments.push(comment._id);
        await post.save();

        res.json({
            msg: "Comment added", comment
        })
    }catch(err){
        res.status(500).json({
            msg: "server error",
            error: err
        })
    }
}

export const deleteComment = async (req: Request, res: Response) => {
    const commentId = req.params.id;
    const userId = (req as any).userId;

    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ msg: "comment not found" });
        }

        if (comment.user.toString() !== userId.toString()) {
            return res.status(403).json({ msg: "Not authorized to delete this comment" });
        }

        await Comment.findByIdAndDelete(commentId);

        await Post.findByIdAndUpdate(comment.post, {
            $pull: { comments: commentId }
        });

        res.json({ msg: "comment deleted successfully" });
    } catch (err) {
        res.status(500).json({
            msg: "server error",
            error: err
        });
    }
}

export const savePost = async (req: Request, res: Response) =>{
    try{
        const userId = (req as any).userId;
        const postId = req.params.id;
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                msg: "user not found"
            })
        }

        const alreadySaved = await User.exists({
            _id: userId, 
            savedPosts: req.params.id 
        });

        if(alreadySaved){
            await User.updateOne({
                _id: userId 
            }, {
                $pull: {
                    savedPosts: postId
                }
            })
            return res.json({ msg:"Post unsaved" });
        }else{
            await User.updateOne({
                _id: userId
            },{
                $addToSet: {
                    savedPosts: new mongoose.Types.ObjectId(postId)
                }
            });
            return res.json({
                msg:"Post saved"
            })
        }

    }catch(err){
         res.status(500).json({ 
            msg: "Server error",
            error: err 
        });
    }
}

export const getFeed = async (req: Request, res: Response) =>{
    try{
        const userId = (req as any).userId;
        const user = await User.findById(userId).populate("following", "_id");

        if(!user){
            return res.status(404).json({
                msg: "user not found"
            });
        }

        let page = parseInt(req.query.page as string) ||1;
        let limit = parseInt(req.query.limit as string) || 10;
        if(page < 1){
            page = 1;
        } 
        const followingIds = user.following.map((f)=> f._id);
        followingIds.push(userId);

        const totalPosts = await Post.countDocuments({
            user: {
                $in: followingIds
            }
        })
        const posts = await Post.find({
            user: {
                $in: followingIds
            }
        })
          .populate("user", "fullname profileImage")
          .sort({createdAt: -1})
          .skip((page - 1) * limit)
          .limit(limit);

        const enrichedPosts = await Promise.all(
            posts.map(async (post)=>{
                const likedByCurrentUser = post.likes.some(
                    (id) => id.toString() === userId.toString()
                );

                const savedByCurrentUser = user.savedPosts.some(
                    (id) => id.toString() === post._id.toString()
                );

                return {
                    _id: post._id,
                    user: post.user,
                    image: post.image,
                    caption: post.caption,
                    likesCount: post.likes.length,
                    commentsCount: post.comments.length,
                    likedByCurrentUser,
                    savedByCurrentUser
                }
            })
        );

        res.json({
            page,
            limit,
            totalPosts,
            totalPages: Math.ceil(totalPosts/limit),
            posts: enrichedPosts
        })


    }catch(err){
        res.status(500).json({
        msg: "server error",
        error: err,
    });
    }
}
