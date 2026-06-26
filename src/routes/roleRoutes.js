import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all roles
router.get("/", async (req, res) => {
  try {
    const roles = await prisma.role.findMany();

    return res.json(roles);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
