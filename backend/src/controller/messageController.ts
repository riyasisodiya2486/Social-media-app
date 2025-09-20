import { Request, Response } from "express";
import { Message } from "../model/message";

export const getMessages = async(req: Request, res: Response)=>{
    try{
        const userId = (req as any).userId;
        const {recipientId, page = 1, limit = 50 } = req.query;

        if(!userId || !recipientId){
            return res.status(400).json({
                msg: "Missing user or recipient id"
            });
        }

        const messages = await Message.find({
            $or: [
                {sender: userId, recipent: recipientId},
                {sender: recipientId, recipent: userId}
            ]
        })
        .sort({createdAt: -1})
        .skip((parseInt(page as string)-1) * parseInt(limit as string))
        .limit(parseInt(limit as string))
        .exec();

        return res.json(messages);
        
    }catch(err){
        return res.status(500).json({
            msg:  "Server error",
            err
        })
    }
}