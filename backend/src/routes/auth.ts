import express from "express"
import { signup, signin, forgetPassword, resetPassword, deleteAccount } from "../controller/authController";
import { middleware } from "../middleware/middleware";

const route = express.Router();

route.post("/signup", signup);
route.post("/signin", signin);
route.post("/forgetpassword", forgetPassword);
route.post("/resetpassword/:token", resetPassword);
route.delete("/deleteaccount", middleware, deleteAccount);

export default route;