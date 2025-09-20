import express from "express"
import { createUserProfile, getUser, getUserProfile, followUser, unfollowUser } from "../controller/userController";
import { middleware } from "../middleware/middleware";
import { upload } from "../middleware/multer";
const route = express.Router();

route.put("/create", upload.single("image"), middleware, createUserProfile)
route.get("/:id", middleware, getUser);
route.post("/follow/:id", middleware, followUser);
route.post("/unfollow/:id", middleware, unfollowUser);
route.post("/profile/:id", middleware, getUserProfile);

export default route;