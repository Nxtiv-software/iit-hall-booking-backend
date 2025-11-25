import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all roles
router.get("/", async (req, res) => {
  try {
    const roles = await prisma.role.findMany();

    res.json(roles);
  } catch (error) {
    console.log(error.message);
    res.sendStatus(500).json({ message: error.message });
  }
});

export default router;
