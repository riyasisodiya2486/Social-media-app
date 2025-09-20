import { Server, Socket } from "socket.io";
import { Message } from "../model/message";

let io: Server;

export const initSocket = (server: any) =>{
    io = new Server(server, {
        cors: {origin: "*"}
    });

    io.on("connection", (socket: Socket)=>{
        console.log("User connected", socket.id);

        socket.on("join", (userId: string)=>{
            socket.join(userId);
            console.log(`User ${userId} joined personal room`);
        })

        //send message event
        socket.on("sendMessage", async (data: {senderId: string; recipientId: string; text: string })=>{

            try{
                const newMessage = await Message.create({
                    sender: data.senderId,
                    recipent: data.recipientId,
                    message: data.text,
                    read: false
                });

                io.to(data.senderId).to(data.recipientId).emit("receiveMessage", newMessage);
 
            }catch(err){
                console.error("Error sending message", err);
            }

        });

        //typing indicator
        socket.on("typing", (data: {senderId: string, recipientId: string })=>{

            io.to(data.recipientId).emit("typing", {
                senderId: data.senderId
            });
        })
        socket.on("messageRead", async(data: { messageid: string, readerId: string})=>{
            try{
                const message = await Message.findOneAndUpdate({ _id: data.messageid}, 
                    { read: true},
                    { new: true }
                ).lean();

                if(message){
                    //notify send that message was read
                    io.to(message.sender.toString()).emit("messageRead", {
                        messageId: message._id,
                        readerId: data.readerId,
                    })
                }
            }catch(err){
                console.error("Error updating read status:", err);
            }
        });

        socket.on("disconnect", ()=>{
            console.log("user disconnected: ", socket.id);
        })
    })
}

export const getIo = () =>{
    if(!io) throw new Error("Socket.io not initalized");
    return io;
}