import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer"
import { signInSchemga, signupSchema } from "../utils/types";
import { User } from "../model/user";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const signup = async (req: Request, res: Response) => {
    const createPayload = req.body;
    const parsePayload = signupSchema.safeParse(createPayload);
    if(!parsePayload.success){
        return res.status(403).json({
            msg: "invalid inputs"
        })
    }

    const hashedPassword = await bcrypt.hash(createPayload.password, 10);

    try{
        const response = await User.findOne({
            username: parsePayload.data.username,
            email: parsePayload.data.email,
        })

        if(response?.username){
            return res.status(403).json({
                msg: "user already exist with username"
            })
        }
        if(response?.email){
            return res.status(403).json({
                msg: "user already exist with email"
            })
        }

        await User.create({
            username: parsePayload.data.username,
            email: parsePayload.data.email,
            password: hashedPassword
        })

        return res.json({
            msg: "successfully created the profile"
        })

    }catch(e){
        return res.status(401).json({
            msg: e
        })
    }
}

export const signin = async (req: Request, res: Response) => {
    const createPayload = req.body;
    const parsePayload = signInSchemga.safeParse(createPayload);
    if(!parsePayload.success){
         return res.status(403).json({
            msg: "invalid inputs"
        })
    }

    try{
        const user = await User.findOne({
            username: parsePayload.data.username,
        })

        if(!user){
            return res.json({
                msg: "invalid password or username"
            })
        }
        const isMatchPassword = await bcrypt.compare(parsePayload.data.password, user.password)

        if(!isMatchPassword){
            return res.json({
                msg: "invalid password or username"
            })
        }

        const token = jwt.sign({userId: user._id, username: user.username}, JWT_SECRET, {expiresIn: '7d'});

        return res.json({
            msg: "successfully logged in",
            token
        })
        
    }catch(e){
        return res.json({
            msg: e
        })
    }
}

export const forgetPassword = async (req: Request, res: Response) => {
    const {email} = req.body;
    if(!email){
        return res.status(400).json({
            msg: "enter the email"
        })
    }

    try{
        const user = await User.findOne({
            email: email
        })
        if(!user){
            return res.status(403).json({
                msg: "invalid email"
            })
        }
        const token = jwt.sign({id: user._id}, JWT_SECRET, {expiresIn: "15m"})

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const resetLink = `http://localhost:4000/api/auth/resetpassword/${token}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Password Reset",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password. Link valid for 15 minutes.</p>`
        });

        res.json({
            msg: "Password resent link sent to your email"
        });

    }catch(err){
        res.status(500).json({
            msg: "Server error", err    
        });
    }
}

export const resetPassword = async (req: Request, res: Response) => {
    const {password} = req.body;
    const {token} = req.params;

    if(!password){
        return res.status(400).json({
            msg: "Password is required"
        })
    }
    try{
        const decoded = jwt.verify(token, JWT_SECRET) as {id: string};
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.findByIdAndUpdate(decoded.id, {
            password: hashedPassword
        });
        return res.json({
            msg: "Password reset successful"
        });

    }catch(err){
        res.status(400).json({
            msg: "Invalid or expired token"
        })
    }
}

export const deleteAccount = async (req: Request, res: Response) =>{
    const userId = (req as any).userId;
    try{
        const user = await User.findByIdAndDelete(userId);
        if(!user){
            return res.status(404).json({
                msg: "user not found"
            });
        }

        return res.json({
            msg: "successfully deleted account"
        })
    }catch(err){
        return res.status(500).json({
            msg: "server error",
            error: err,
        })
    }
}
