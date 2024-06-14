import express from "express";
import { User } from "../models/userModel.js";
import {
  checkEmail,
  generateToken,
  decodeToken,
  isAuth,
} from "../utils/index.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/signin", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    let user;
    if (!emailOrUsername || !password) {
      return res.status(400).json({
        message: "Fill all required fields: email, password.",
      });
    }
    if (emailOrUsername.includes("@")) {
      user = await User.findOne({ email: emailOrUsername }).exec();
    } else {
      user = await User.findOne({ username: emailOrUsername }).exec();
    }
    if (!user) {
      return res.status(404).json({ message: "Email or Username not found." });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      const token = generateToken(user);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      return res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
      });
    } else {
      return res.status(401).json({ message: "Incorrect password." });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { email, password, cfPassword } = req.body;
    if (!email || !password || !cfPassword) {
      return res.status(400).json({
        message: "Fill all required fields: email, password, confirm password.",
      });
    }

    const emailExist = await checkEmail(email);
    if (emailExist) {
      return res.status(400).json({
        message: "Email has already.",
      });
    }

    if (password !== cfPassword) {
      return res.status(400).json({
        message: "Password not match",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const username = email.split("@")[0];
    const newUser = new User({
      email: email,
      username: username,
      password: hashedPassword,
    });
    await newUser.save();
    return res.status(200).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
});

router.post("/signout", (req, res) => {
  try {
    res.clearCookie("token");
    return res.json({ message: "Logout successful." });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
});

router.get("/getPeople", isAuth, async (req, res) => {
  const token = req.cookies.token;
  try {
    const userId = await decodeToken(token);
    // const people = await User.find({ _id: { $ne: userId } });
    const people = await User.aggregate([
      {
        $match: {
          $expr: { $ne: ["$_id", { $toObjectId: userId }] },
        },
      },
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
          unreadChatCount: { $arrayElemAt: ["$unreadChats.unreadCount", 0] },
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
    return res.status(200).json(people);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
});

export default router;
