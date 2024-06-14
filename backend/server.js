import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoute from "./routes/authRotue.js";
import chatRoute from "./routes/chatRoute.js";
import { Chat } from "./models/chatModel.js";
import { User } from "./models/userModel.js";

const app = express();
dotenv.config();

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/api/auth", authRoute);
app.use("/api/chats", chatRoute);

app.use("/", (req, res) => {
  return res.send("It works!");
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", async (message) => {
    const session = await Chat.startSession();
    session.startTransaction();

    try {
      const { sendId, receivedId, content } = JSON.parse(message);
      const chatMessage = new Chat({
        content: content,
        sendId,
        receivedId,
      });

      await chatMessage.save({ session });

      const updateChat = await Chat.findById(chatMessage._id).session(session);
      if (!updateChat) {
        throw new Error(`Chat with id ${chatMessage._id} not found`);
      }

      updateChat.status = "delivered";
      await updateChat.save({ session });

      await session.commitTransaction();
      session.endSession();

      wss.clients.forEach(async (client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify(chatMessage));
          // {
          //   $match: {
          //     $expr: { $ne: ["$_id", { $toObjectId: receivedId }] },
          //   },
          // },
          const people = await User.aggregate([
     
            {
              $lookup: {
                from: "chats",
                let: { userId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$sendId", "$$userId"] },
                          { $eq: ["$status", "delivered"] },
                        ],
                      },
                    },
                  },
                  {
                    $count: "unreadCount",
                  },
                ],
                as: "unreadChats",
              },
            },
            {
              $addFields: {
                unreadChatCount: {
                  $arrayElemAt: ["$unreadChats.unreadCount", 0],
                },
              },
            },
            {
              $project: {
                _id: 1,
                username: 1,
                email: 1,
                unreadChatCount: 1,
              },
            },
          ]);
          client.send(
            JSON.stringify({ type: "updateUnreadCount", data: people })
          );
        }
      });
    } catch (error) {
      console.error("Transaction error:", error);
      await session.abortTransaction();
      session.endSession();
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

server.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});

mongoose
  .connect(
    `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWRD}@db.ca2ih.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=${process.env.APP_NAME}`
  )
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log(err));
