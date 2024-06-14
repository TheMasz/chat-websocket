import express from "express";
import { Chat } from "../models/chatModel.js";

const router = express.Router();

router.get("/:sendId/:receivedId", async (req, res) => {
  const session = await Chat.startSession();
  session.startTransaction();

  try {
    const { sendId, receivedId } = req.params;
    // receivedId is another people sent to me
    // sendId is me sent to another
    const chats = await Chat.find({
      $or: [
        { sendId, receivedId },
        { sendId: receivedId, receivedId: sendId },
      ],
    }).sort("createdAt");

    await Chat.updateMany(
      { sendId: receivedId, receivedId: sendId, status: "delivered" },
      { status: "read" },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(chats);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: error.message });
  }
});

export default router;
