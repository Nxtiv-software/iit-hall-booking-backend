import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get all departments
router.get("/", async (req, res) => {
  try {
    const departments = await prisma.department.findMany();

    res.json(departments);
  } catch (error) {
    console.log(error.message);
    res.sendStatus(500).json({ message: error.message });
  }
});

export default router;
