import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all statuses
router.get("/", async (req, res) => {
  try {
    const statuses = await prisma.status.findMany();

    return res.json(statuses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
