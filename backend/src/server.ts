import express from "express";
import { createServer } from "http";
import connectDB from "./config/db";
import authRouter from "./routes/auth";
import postRouter from "./routes/post";
import userRouter from "./routes/user";
import storyRouter from "./routes/story";
import { initSocket } from "./sockets/socket";
import dotevn from "dotenv";
dotevn.config();

connectDB();
const app = express();
app.use(express.json());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/post', postRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/stories', storyRouter)

const httpServer = createServer(app);

initSocket(httpServer);
const PORT = process.env.PORT  || 4000;

httpServer.listen(PORT, ()=> console.log(`Server running on port ${PORT}`))
;;;