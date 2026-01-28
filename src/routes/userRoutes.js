import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get current user profile
router.get("/me", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        uniEmail: true,
        gender: true,
        avatarUrl: true,
        phoneNum: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        admin: {
          select: {
            id: true,
            adminLevel: true,
            buildingId: true,
            departmentId: true,
          },
        },

        superAdmin: {
          select: {
            id: true,
          },
        },
      },
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
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        uniEmail: true,
        gender: true,
        phoneNum: true,
        avatarUrl: true,
        role: {
          select: { name: true },
        },
        createdAt: true,
      },
    });

    if(!users){
        return res.status(404).json({message: "Users not found"});
    }

    return res.json({ users });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

//Get user by Id
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        uniEmail: true,
        gender: true,
        avatarUrl: true,
        phoneNum: true,
        role: {
          select: { name: true },
        },
      },
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
