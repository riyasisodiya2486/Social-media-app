import express from "express";
import multer from "multer";
import { middleware } from "../middleware/middleware";
import { upload } from "../middleware/multer";
import { createPost, getUserPosts, likePost, getPostById, commentOnPost, savePost, getFeed, deletePost } from "../controller/postController";

const route = express.Router();

route.post("/create", upload.single("image"), middleware,  createPost);
route.get("/user/:userId", middleware, getUserPosts);
route.get("/:id", middleware, getPostById);
route.delete("/:id", middleware, deletePost);
route.put("/like/:id", middleware, likePost);
route.post("/comment/:id", middleware, commentOnPost);
route.put("/save/:id", middleware, savePost);
route.get("/feed", middleware, getFeed);


export default route;

