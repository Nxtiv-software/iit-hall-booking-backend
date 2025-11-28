import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all the users
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    if(!users){
        return res.status(404).json({message: "Users not found"});
    }

    return res.json({ users });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

//Get user by Id
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id },
    });

    if(!user){
        return res.status(404).json({message: "User not found"});
    }
    return res.json({ user });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

export default router;
