import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all logs
router.get("/", async (req, res) => {
  try {
    const logs = await prisma.log.findMany();

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
