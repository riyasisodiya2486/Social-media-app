import express, {Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET as string;

export function middleware(req: Request, res: Response, next: NextFunction){
    const authHeader = req.headers.authorization;

    if(!authHeader?.startsWith("Bearer ")){
        return res.status(403).json({
            msg: "unathoriazed access"
        })
    }
    const token = authHeader.split(" ")[1];
    try{
        const decoded = jwt.verify(token, JWT_SECRET) as {userId:  string, username: string};
        if(!decoded){
            return res.status(401).json({
                    msg: "Invalid token"
                });
        }
        (req as any).userId = decoded.userId;
        (req as any).username = decoded.username;

        next();
        
    }catch(err){
        return res.status(401).json({ msg: "Invalid or expired token" });
    }
}