import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all departments
router.get("/", async (req, res) => {
  try {
    const departments = await prisma.department.findMany();

    return res.json(departments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
