import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get current user profile
router.get("/me", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
    });

    res.json({ user });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(503);
  }
});

//Get all the users
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    if(!users){
        return res.status(404).json({message: "Users not found"});
    }

    res.json({ users });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(503);
  }
});

//Get user by Id
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if(!user){
        return res.status(404).json({message: "User not found"});
    }
    res.json({ user });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(503);
  }
});

export default router;
